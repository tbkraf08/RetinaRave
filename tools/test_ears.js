// Node test for assets/engine/ears: stream tools/work/SeeYouDrop[.48000].st.f32 through `Ears` in 512-sample blocks,
// read() once per 1/60 s of audio (heard = pushed — the deterministic file case), and grade against tools/truth.
//
//   node tools/test_ears.js                        # both rates, the ruler summary, exit 1 on a failed assertion
//   node tools/test_ears.js --sr=44100 --verbose
//   node tools/test_ears.js --trace tools/work/ears-node-SeeYouDrop.json   # write the frozen trace format
//   node tools/test_ears.js --cost                 # the cost table only
//   node tools/test_ears.js --keys                 # §62: the key ruler only — the ears' tonic against every truth tonic
// The PCM comes from `python3 tools/truth/trackmap.py SeeYouDrop --pcm --sr=48000`.
import fs from 'fs';
import path from 'path';
import { Ears, EARS_FIELDS } from '../assets/engine/ears/ears.js';
import { buildMap, mapAt, mapCross } from '../assets/engine/map/map.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const arg = (k, d) => { const a = process.argv.find((v) => v.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const has = (k) => process.argv.includes('--' + k);
const W = (n, s) => String(s).padStart(n);
let FAIL = 0;
const ok = (name, pass, value, target) => {
  if (!pass) FAIL++;
  console.log('  ' + (pass ? 'pass' : 'FAIL') + '  ' + name.padEnd(40) + String(value).padEnd(34) + (target || ''));
};

export function loadPcm(track, sr) {
  const tag = sr === 44100 ? '' : '.' + sr;
  const p = path.join(ROOT, 'tools/work', `${track}${tag}.st.f32`);
  const meta = JSON.parse(fs.readFileSync(p + '.json', 'utf8'));
  const buf = fs.readFileSync(p);
  const il = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength >> 2);
  const n = meta.n, L = new Float32Array(n), R = new Float32Array(n);
  for (let i = 0; i < n; i++) { L[i] = il[2 * i]; R[i] = il[2 * i + 1]; }
  return { L, R, sr: meta.sr, n };
}

// Stream the whole track. `fps` reads per second of audio, heard time = the newest pushed sample (the det case).
export function stream(pcm, opts = {}) {
  const fps = opts.fps || 60, B = 512, sr = pcm.sr;
  const ears = new Ears(sr, opts.ears || {});
  const cols = {}; for (const f of EARS_FIELDS) cols[f] = [];
  const t = [], frames = [];
  const evs = [];
  let nextRead = 0, k = 0, pushNs = 0, readNs = 0, pushes = 0, reads = 0;
  const per = [];
  const bl = new Float32Array(B), br = new Float32Array(B);
  // `stopAt` (s) stops the stream early — the key ruler grades a 20-100 s window on five tracks and has no use for the
  // 150 s after it. Omitted = the whole track, which is what every other ruler takes.
  const nEnd = opts.stopAt ? Math.min(pcm.n, Math.ceil(opts.stopAt * sr)) : pcm.n;
  for (let s = 0; s + B <= nEnd; s += B) {
    bl.set(pcm.L.subarray(s, s + B)); br.set(pcm.R.subarray(s, s + B));
    const t0 = s / sr;
    const a = process.hrtime.bigint();
    ears.push(bl, br, t0);
    const b = process.hrtime.bigint();
    pushNs += Number(b - a); pushes++;
    const tEnd = (s + B) / sr;
    let rns = 0;
    while (nextRead <= tEnd) {
      const c = process.hrtime.bigint();
      const out = ears.read(nextRead);
      const d = process.hrtime.bigint();
      rns += Number(d - c); reads++;
      for (const f of EARS_FIELDS) cols[f].push(typeof out[f] === 'number' && Number.isFinite(out[f]) ? out[f] : null);
      t.push(Math.round(nextRead * 1e6) / 1e6); frames.push(k++);
      for (const e of ears.events) evs.push({ type: e.type, t: Math.round(e.t * 1e6) / 1e6, vel: e.vel, note: e.note });
      nextRead += 1 / fps;
    }
    readNs += rns;
    per.push((Number(b - a) + rns) / 1e6);
  }
  per.sort((x, y) => x - y);
  return { ears, cols, t, frames, evs, sr,
    cost: { blocks: pushes, reads, pushMed: med(per), p99: per[Math.min(per.length - 1, Math.floor(0.99 * per.length))],
      pushMs: pushNs / 1e6 / pushes, readMs: readNs / 1e6 / reads } };
}
const med = (a) => (a.length ? a[a.length >> 1] : 0);
const pct = (a, q) => { if (!a.length) return 0; const b = a.slice().sort((x, y) => x - y); return b[Math.min(b.length - 1, Math.floor(q * b.length))]; };

function match(det, ref, tol) {
  const used = new Array(ref.length).fill(false), pairs = []; let extra = 0;
  for (const d of det) {
    let bi = -1, bd = 1e9;
    for (let i = 0; i < ref.length; i++) { const e = Math.abs(ref[i] - d); if (!used[i] && e < bd) { bd = e; bi = i; } }
    if (bi >= 0 && bd <= tol) { used[bi] = true; pairs.push([d, ref[bi]]); } else extra++;
  }
  return { pairs, missed: used.filter((u) => !u).length, extra };
}
function fm(det, ref, tol) {
  const m = match(det, ref, tol), tp = m.pairs.length;
  const p = tp / Math.max(1, tp + m.extra), r = tp / Math.max(1, tp + m.missed);
  return { F: p + r ? 2 * p * r / (p + r) : 0, p, r, tp, missed: m.missed, extra: m.extra, pairs: m.pairs };
}
const inw = (a, t0, t1) => a.filter((v) => v >= t0 && v < t1);

const ANN = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/truth/SeeYouDrop.sections.json'), 'utf8'));
const BADBEATS = [];
// ---------------------------------------------------------------------------------------------------- the sub rulers
function subRulers(R, truth, label) {
  // `ct.fps` is the NOMINAL 100; the hop is 22 samples at ysr = 2205, so the real rate is 100.2273 Hz and reading the
  // contour at 100 drifts 358 ms by 157 s — 2.4 semitones of an 808 slide. v0.15 pass 2 added `fpsExact` to the truth.
  const ct = truth.contour.f0td, cf0 = ct.f0, c0 = ct.t0, cfps = ct.fpsExact || ct.fps;
  const sh = truth.contour.sub, st10 = truth.contour.t;
  const hz = R.cols.subHz, t = R.t;
  const cents = [];
  let loud = 0;
  for (let i = 0; i < t.length; i++) {
    const j = Math.max(0, Math.min(cf0.length - 1, Math.round((t[i] - c0) * cfps)));
    const f = cf0[j];
    if (!(f > 0)) continue;
    let k = 0; while (k + 1 < st10.length && st10[k + 1] < t[i]) k++;
    if (!(sh[k] >= 0.30)) continue;
    loud++;
    if (hz[i] > 0) cents.push(1200 * Math.log2(hz[i] / f));
  }
  const good = cents.filter((c) => Math.abs(c) <= 30).length;
  // The frozen ruler, graded frame by frame against contour.f0td. REPORTED, not asserted: the reference is only 77 % / 37 %
  // self-consistent to 30 cents on the groove / groove-return (f0td against a 5-frame median of itself), so 90 % is not
  // reachable there by anything. The note-level ruler below is the one that is asserted.
  ok(`[${label}] subHz +-30 cents of f0td (frame)`, true,
    `${(100 * good / Math.max(1, loud)).toFixed(1)} % of ${loud} sub-loud frames`, 'reported (reference ceiling ~80 %)');
  // The note-level ruler: does the ears' subNote name the same pitch class as the truth's per-BEAT slice? This is what a
  // scene reads (a figure table is indexed by pitch class), and the beat grain is the truth's own musical resolution.
  const beats = (truth.slices && truth.slices.beat) || [];
  let nb = 0, nOk = 0;
  const NAMEPC = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
  for (const b of beats) {
    if (!(b.voiced >= 0.5) || !(b.f0 > 0) || b.note === '-') continue;
    const pc = NAMEPC[b.note.replace(/-?\d+$/, '')];
    if (pc === undefined) continue;
    let got = -1, n0 = 0;
    const cnt = new Array(12).fill(0);
    for (let i = 0; i < t.length; i++) if (t[i] >= b.t && t[i] < b.t + b.dur) { const v = R.cols.subNote[i]; if (v !== null && v >= 0) { cnt[v]++; n0++; } }
    if (!n0) continue;
    got = cnt.indexOf(Math.max(...cnt));
    nb++; if (got === pc) nOk++; else if (has('verbose')) BADBEATS.push(`${b.t.toFixed(2)} truth ${b.note} got ${got}`);
  }
  ok(`[${label}] subNote = the truth's beat-slice note`, nb > 0 && nOk / nb >= 0.90,
    `${(100 * nOk / Math.max(1, nb)).toFixed(1)} % of ${nb} voiced beats`, '>= 90 %');
  // the four walk notes. The annotation's 13.0 / 16.1 / 19.3 / 22.6 come from a 10 Hz run-length coding of a 0.37 s STFT;
  // the truth's own 100 Hz YIN puts the note arrivals at 12.98 / 16.09 / 19.30 / 22.51 and the 22-60 Hz attack of the first
  // one at 12.80. Both are reported; the assertion uses the f0td arrivals with the annotation's 50 ms.
  // v2 of the annotation carries both, measured: `attack` = the E0 bar line the note starts on (within 4-21 ms of the
  // truth's own 40-150 Hz onset) and `arrival` = the first contour frame that NAMES the note, 40-140 ms later.
  const walkA = ANN.walk ? ANN.walk.map((w) => w.attack) : [13.0, 16.1, 19.3, 22.6];
  const walkY = ANN.walk ? ANN.walk.map((w) => w.arrival) : [12.98, 16.09, 19.30, 22.51];
  const notes = R.evs.filter((e) => e.type === 'subNote').map((e) => e.t);
  const near = (v) => { const c = notes.filter((n) => Math.abs(n - v) <= 0.25); if (!c.length) return null; let b = c[0]; for (const x of c) if (Math.abs(x - v) < Math.abs(b - v)) b = x; return b - v; };
  const wa = walkA.map(near), wy = walkY.map(near);
  ok(`[${label}] walk notes vs the f0td arrivals`, wy.every((d) => d !== null && Math.abs(d) <= 0.05),
    wy.map((d) => (d === null ? 'miss' : (1000 * d).toFixed(0) + 'ms')).join(' ') + '  | vs the annotation: ' + wa.map((d) => (d === null ? 'miss' : (1000 * d).toFixed(0))).join(' '),
    'each within 50 ms');
  // the slides on 57.6-90 s
  const ts = truth.sub_slides.filter((s) => s.t0 >= 57.6 && s.t0 < 90);
  const ds = traceSlides(t, hz).filter((s) => s[0] >= 57.6 && s[0] < 90);
  const m = match(ds.map((s) => s[0]), ts.map((s) => s.t0), 0.25);
  let sign = 0;
  for (const [d] of m.pairs) { const q = ds.find((s) => s[0] === d); if (q && q[2] < 0) sign++; }
  ok(`[${label}] slides 57.6-90 s`, m.pairs.length >= 0.5 * ts.length && sign === m.pairs.length,
    `${m.pairs.length} of ${ts.length} truth, ${m.extra} extra, ${sign} downward, median span ${(ds.length ? med(ds.map((s) => s[1] - s[0]).sort((a, b) => a - b)) : 0).toFixed(3)} s`,
    '>= 50 %, all downward');
  // subPure: a sine on the groove and the drops, harmonic on the intro and 101-105.7 s
  const pr = (t0, t1) => { const v = []; for (let i = 0; i < t.length; i++) if (t[i] >= t0 && t[i] < t1 && R.cols.subPure[i] !== null) v.push(R.cols.subPure[i]); return v.length ? v.reduce((a, b) => a + b) / v.length : 0; };
  const gro = pr(25, 45), dr1 = pr(60, 88), intro = pr(1, 12), harm = pr(101.5, 105.5);
  ok(`[${label}] subPure sine vs harmonic`, gro > 0.6 && dr1 > 0.6 && intro < 0.45 && harm < 0.45,
    `groove ${gro.toFixed(2)} drop1 ${dr1.toFixed(2)} | intro ${intro.toFixed(2)} 101-105 ${harm.toFixed(2)}`,
    'sine > 0.6, harmonic < 0.45');
  // subIn at the drop, and the gate ducking through drop 2
  // the truth's drop-1 bar line is 57.606 and the causal 22-60 Hz sub energy crosses p90/8 at 57.61 (measured at a 8 ms hop)
  const D1 = truth.drops && truth.drops.length ? truth.drops[0] : 57.606;
  const ins = R.evs.filter((e) => e.type === 'subIn').map((e) => e.t);
  let best = null;
  for (const v of ins) if (Math.abs(v - D1) <= 0.30 && (best === null || Math.abs(v - D1) < Math.abs(best - D1))) best = v;
  const flut = ins.filter((v) => v >= D1 - 2 && v < D1 - 0.05).length;
  ok(`[${label}] subIn at drop 1 (${D1.toFixed(3)})`, best !== null && Math.abs(best - D1) <= 0.05,
    best === null ? 'none within 300 ms' : `${best.toFixed(3)} s (${(1000 * (best - D1)).toFixed(0)} ms), ${flut} flutter in the 2 s before`,
    'within 50 ms');
  const outs = R.evs.filter((e) => (e.type === 'subOut' || e.type === 'subIn') && e.t >= 105.7 && e.t < 130.5).length;
  const bars = (130.5 - 105.7) / 1.5997;
  ok(`[${label}] subGate ducks in drop 2`, outs / bars >= 0.5,
    `${outs} gate edges over ${bars.toFixed(1)} bars (${(outs / bars).toFixed(2)}/bar)`, '>= 0.5 edges/bar');
}

export function traceSlides(t, hz) {
  const n = t.length, out = [];
  const st = new Float64Array(n); const ok2 = new Uint8Array(n);
  for (let i = 0; i < n; i++) { const v = hz[i]; ok2[i] = v > 0 ? 1 : 0; st[i] = v > 0 ? 12 * Math.log2(v / 55) : NaN; }
  let i = 0;
  while (i < n - 2) {
    if (!ok2[i]) { i++; continue; }
    let j = i, bj = -1, bd = 0;
    while (j + 1 < n && ok2[j + 1] && Math.abs(st[j + 1] - st[j]) <= 1.5 && t[j + 1] - t[i] <= 0.5) {
      j++; const d = st[j] - st[i];
      if (t[j] - t[i] >= 0.05 && Math.abs(d) >= 1 && (bj < 0 || Math.abs(d) > Math.abs(bd))) { bj = j; bd = d; }
    }
    if (bj > 0) {
      let mono = true; for (let q = i; q < bj; q++) if ((st[q + 1] - st[q]) * Math.sign(bd) <= -0.3) mono = false;
      let held = true, lo = st[bj], hi2 = st[bj];
      for (let q = bj; q < Math.min(n, bj + 4); q++) { if (!ok2[q]) held = false; else { lo = Math.min(lo, st[q]); hi2 = Math.max(hi2, st[q]); } }
      if (mono && held && hi2 - lo < 0.5) { out.push([t[i], t[bj], bd]); i = bj + 1; continue; }
    }
    i++;
  }
  return out;
}

// -------------------------------------------------------------------------------------------- percussion / feel / texture
function percRulers(R, truth, label) {
  const T = truth.onsets, bare = truth.bare808;
  const kicks = R.evs.filter((e) => e.type === 'kick').map((e) => e.t);
  const k2545 = fm(inw(kicks, 25, 45), inw(T.click, 25, 45), 0.030);
  ok(`[${label}] kick F 25-45 s`, k2545.F >= 0.90,
    `${k2545.F.toFixed(3)} (P ${k2545.p.toFixed(2)} R ${k2545.r.toFixed(2)}, tp ${k2545.tp} miss ${k2545.missed} extra ${k2545.extra})`, '>= 0.90');
  let onBare = 0;
  for (const v of kicks) { let d = 9; for (const b of bare) { const e = Math.abs(b - v); if (e < d) d = e; } if (d <= 0.015) onBare++; }
  ok(`[${label}] kicks on bare 808s`, onBare / Math.max(1, kicks.length) <= 0.05,
    `${(100 * onBare / Math.max(1, kicks.length)).toFixed(1)} % (${onBare}/${kicks.length})`, '<= 5 %');
  for (const [cls, ref] of [['snare', T.mid], ['hat', T.high]]) {
    const d = R.evs.filter((e) => e.type === cls).map((e) => e.t);
    const secs = [[25, 45], [57.6, 90], [105.7, 130.5]];
    const parts = secs.map(([a, b]) => fm(inw(d, a, b), inw(ref, a, b), 0.030).F.toFixed(2)).join(' / ');
    ok(`[${label}] ${cls} F (25-45 / 57-90 / 105-130)`, true, parts + `  n=${d.length}`, 'reported');
  }
  const lag = [];
  for (const [cls, ref] of [['kick', T.click], ['snare', T.mid], ['hat', T.high]]) {
    const d = R.evs.filter((e) => e.type === cls).map((e) => e.t);
    const m = match(d, ref, 0.045);
    if (m.pairs.length) {
      const L = m.pairs.map(([a, b]) => a - b).sort((x, y) => x - y);
      lag.push(`${cls} med ${(1000 * med(L)).toFixed(0)} p90 ${(1000 * pct(L, 0.9)).toFixed(0)}`);
    }
  }
  ok(`[${label}] onset time error vs truth`, true, lag.join(' | '), 'ms, reported');
  const avg = (col, a, b) => { let s = 0, n = 0; for (let i = 0; i < R.t.length; i++) if (R.t[i] >= a && R.t[i] < b && col[i] !== null) { s += col[i]; n++; } return n ? s / n : 0; };
  const gK = avg(R.cols.denS, 25, 45) + avg(R.cols.denH, 25, 45);
  const cK = avg(R.cols.denS, 44.9, 49.9) + avg(R.cols.denH, 44.9, 49.9);
  const c2 = avg(R.cols.denS, 96, 101) + avg(R.cols.denH, 96, 101);
  ok(`[${label}] den* climb vs groove`, cK >= 1.6 * gK || c2 >= 1.6 * gK,
    `groove ${gK.toFixed(1)} climb1 ${cK.toFixed(1)} (${(cK / Math.max(1e-6, gK)).toFixed(2)}x) climb2 ${c2.toFixed(1)} (${(c2 / Math.max(1e-6, gK)).toFixed(2)}x)`,
    '>= 1.6x');
  const pl = (a, b) => { const v = []; for (let i = 0; i < R.t.length; i++) if (R.t[i] >= a && R.t[i] < b && R.cols.pulse[i] !== null) v.push(R.cols.pulse[i]); return v.length ? v.reduce((x, y) => x + y) / v.length : 0; };
  ok(`[${label}] pulse on the drop sections`, true,
    `57.6-90 ${pl(57.6, 90).toFixed(2)}  105.7-130 ${pl(105.7, 130.5).toFixed(2)}  groove ${pl(25, 45).toFixed(2)}`, '0.5 wanted, reported');
}

function toneRulers(R, truth, label) {
  const tt = truth.tonic, t = R.t, tn = R.cols.tonic, tm = R.cols.tonicMinor;
  let settle = null;
  for (let i = 0; i < t.length; i++) {
    if (tn[i] === tt.pc && tm[i] === (tt.minor ? 1 : 0)) {
      if (settle === null) settle = t[i];
      // require it to stick for 5 s
      let bad = false;
      for (let j = i; j < t.length && t[j] < t[i] + 5; j++) if (tn[j] !== tt.pc) { bad = true; break; }
      if (!bad) break;
      settle = null;
    }
  }
  const last = tn[tn.length - 1];
  ok(`[${label}] tonic settles on ${tt.name}${tt.minor ? 'm' : 'M'}`, settle !== null && settle <= 30,
    settle === null ? `never (ends on pc ${last})` : `${settle.toFixed(1)} s`, '<= 30 s');
  const avg = (col, a, b) => { let s = 0, n = 0; for (let i = 0; i < t.length; i++) if (t[i] >= a && t[i] < b && col[i] !== null) { s += col[i]; n++; } return n ? s / n : 0; };
  const r = R.cols.bassReg;
  const g = avg(r, 25, 45), c1 = avg(r, 44.9, 49.9), c2 = avg(r, 96, 101), intro = avg(r, 1, 12);
  ok(`[${label}] bassReg rises on the climbs + intro`, c1 > g && c2 > g && intro > g,
    `groove ${g.toFixed(2)} | climb1 ${c1.toFixed(2)} climb2 ${c2.toFixed(2)} intro ${intro.toFixed(2)}`, '> the groove');
  const lo = avg(R.cols.lpSweep, 134.5, 157), lg = avg(R.cols.lpSweep, 25, 45);
  ok(`[${label}] lpSweep outro vs groove`, lo > 0.7 && lg < 0.3, `outro ${lo.toFixed(2)}  groove ${lg.toFixed(2)}`, '> 0.7 / < 0.3');
  const secs = [[0, 13, 'intro'], [25, 45, 'groove'], [49.9, 57.6, 'void'], [57.6, 90, 'drop1'], [105.7, 130.5, 'drop2'], [134.5, 157, 'outro']];
  ok(`[${label}] width per section`, true, secs.map(([a, b, n]) => `${n} ${avg(R.cols.width, a, b).toFixed(3)}`).join(' '), 'reported');
}

// ------------------------------------------------------------------------------- the KEY ruler (§62), --keys
// `MS.key` / `MS.mode` are the ears' tonic (engine/features-ears.js). This grades that claim on every track with a
// PCM dump: the MODAL (tonic, tonicMinor) over WIN, against the track's truth tonic.
//
// SYN is what the PAGE's synapse read on the same 20-100 s window, recorded once by
// `PORT=8890 node tools/filetrace.js <t> 20 100 <out> 'key,mode,keyConf,tonic,tonicMinor,tonicConf,eM'` (2026-09-30,
// the §62 session) — it cannot be recomputed here, because synapse's Analyzer needs an AudioWorklet. It is in the
// table so a reader sees WHY the ears won, and so a regression that drags the ears down to synapse's reads is visible.
export const KEY_WIN = [20, 100];
export const KEY_TRACKS = {
  //                 truth pc, minor   synapse's page read (pc, minor, % of frames)
  SeeYouDrop:      { pc: 1, minor: 1, syn: [8, 1, 93], expect: true },
  CyborgNinja:     { pc: 1, minor: 1, syn: [8, 1, 53], expect: false },   // KK is a coin flip here: truth's own margin is C#m .521 / C#M .430 (conf .174)
  Malicious:       { pc: 7, minor: 0, syn: [0, 1, 50], expect: false },   // truth GM .639 / CM .537 / Gm .529 / Cm .516 — a .10 race over four candidates
  WhoLikesToParty: { pc: 2, minor: 0, syn: [11, 1, 100], expect: true },
  Vienna:          { pc: 3, minor: 1, syn: [3, 1, 100], expect: true },
};
const PCN = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const nameOf = (pc, mi) => (pc < 0 ? '--' : PCN[pc]) + (mi ? 'm' : 'M');

function keyRulers() {
  let nEars = 0, nSyn = 0, nWorse = 0;
  for (const track of Object.keys(KEY_TRACKS)) {
    const T = KEY_TRACKS[track];
    let pcm;
    try { pcm = loadPcm(track, 48000); } catch { console.log(`  skip  ${track} (no tools/work/${track}.48000.st.f32 — trackmap.py --pcm --sr=48000)`); continue; }
    const R = stream(pcm, { stopAt: KEY_WIN[1] + 1 });
    const seen = new Map();
    for (let i = 0; i < R.t.length; i++) {
      if (R.t[i] < KEY_WIN[0] || R.t[i] >= KEY_WIN[1]) continue;
      const k = (R.cols.tonic[i] | 0) + ':' + (R.cols.tonicMinor[i] | 0);
      seen.set(k, (seen.get(k) || 0) + 1);
    }
    const tot = [...seen.values()].reduce((a, b) => a + b, 0) || 1;
    const rank = [...seen.entries()].sort((a, b) => b[1] - a[1]);
    const [pc, mi] = rank[0][0].split(':').map(Number);
    const earsOk = pc === T.pc, synOk = T.syn[0] === T.pc;
    if (earsOk) nEars++;
    if (synOk) nSyn++;
    if (synOk && !earsOk) nWorse++;
    const top = rank.slice(0, 2).map(([k, n]) => { const [p, m] = k.split(':').map(Number); return `${nameOf(p, m)} ${Math.round(100 * n / tot)}%`; }).join(' ');
    console.log(`  ${track.padEnd(16)} truth ${nameOf(T.pc, T.minor).padEnd(4)} | ears ${top.padEnd(22)} ${earsOk ? 'pc ok' : 'pc +' + (((pc - T.pc) % 12 + 12) % 12)}`
      + `, mode ${mi === T.minor ? 'ok ' : 'NO '} | synapse ${nameOf(T.syn[0], T.syn[1])} ${String(T.syn[2]).padStart(3)}% ${synOk ? 'pc ok' : 'pc +' + (((T.syn[0] - T.pc) % 12 + 12) % 12)}`);
    ok(`[key] ${track}: ears tonic vs truth`, earsOk === T.expect, `${nameOf(pc, mi)} (${T.expect ? 'must match' : 'known miss, KK ambiguous'})`,
      T.expect ? nameOf(T.pc, T.minor) : 'not ' + nameOf(T.pc, T.minor) + ' (recorded)');
  }
  ok('[key] ears beat synapse on the pitch class', nEars > nSyn, `ears ${nEars}/5, synapse ${nSyn}/5`, 'ears > synapse');
  ok('[key] ears never worse on a track', nWorse === 0, `${nWorse} track(s) synapse gets and the ears lose`, '0');
}

function costTable(R, label) {
  console.log(`  cost [${label}]: push+read per 512 block  median ${R.cost.pushMed.toFixed(4)} ms  p99 ${R.cost.p99.toFixed(4)} ms`
    + `  (push ${R.cost.pushMs.toFixed(4)} mean, read ${R.cost.readMs.toFixed(4)} mean, ${R.cost.blocks} blocks, ${R.cost.reads} reads)`);
  ok(`[${label}] cost per block`, R.cost.pushMed <= 0.19, `${R.cost.pushMed.toFixed(4)} ms median`, '<= 0.19 ms');
}

// The frozen trace format (docs/workers/brief-file.md): every EARS_FIELDS column plus the map's mapAt / mapCross fields,
// so `compare.py` sees exactly what it will see from the page's recorder.
const MAP_FIELDS = ['mapOn', 'toDrop', 'toBoundary', 'buildProg', 'mapSection', 'mapNext', 'mapReturn', 'eG',
  'mapDropEvt', 'mapBoundaryEvt'];
function writeTrace(R, out, track, map) {
  const r5 = (v) => (v === null || !Number.isFinite(v) ? null : Math.round(v * 1e5) / 1e5);
  const cols = {};
  for (const f of EARS_FIELDS) cols[f] = R.cols[f].map(r5);
  const fields = EARS_FIELDS.slice();
  if (map) {
    for (const f of MAP_FIELDS) { cols[f] = []; fields.push(f); }
    const o = {};
    for (let i = 0; i < R.t.length; i++) {
      mapAt(map, R.t[i], o);
      const c = mapCross(map, i ? R.t[i - 1] : 0, R.t[i]);
      for (const f of MAP_FIELDS.slice(0, 8)) cols[f].push(r5(o[f]));
      cols.mapDropEvt.push(c.drop ? 1 : 0);
      cols.mapBoundaryEvt.push(c.boundary ? 1 : 0);
    }
  }
  const tr = { track, mode: 'node', sr: R.sr, at: 0, fps: 60, detLead: 0, fields,
    f: R.frames, t: R.t, cols, log: R.evs.map((e) => ({ type: e.type, t: e.t, vel: Math.round(1e3 * (e.vel || 0)) / 1e3, note: e.note })) };
  fs.writeFileSync(out, JSON.stringify(tr));
  console.log(`  trace -> ${out}  (${R.t.length} frames, ${fields.length} fields, ${(fs.statSync(out).size / 1e6).toFixed(1)} MB)`);
  return tr;
}

// importable as a module (tools/work diagnostics, tools/test_map.js) — the test itself runs only as the entry point
const ENTRY = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename);
if (!ENTRY) { /* nothing runs on import */ } else main();
function main() {
if (has('keys')) {                 // §62: the key ruler alone, across every track with a PCM dump
  console.log('\n=== the key ruler: MS.key / MS.mode are the ears\' tonic (§62), modal over 20-100 s');
  keyRulers();
  console.log(FAIL ? `\n${FAIL} FAILED` : '\nall key rulers pass');
  process.exit(FAIL ? 1 : 0);
}
const truth = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/truth/SeeYouDrop.json'), 'utf8'));
const rates = arg('sr') ? [Number(arg('sr'))] : [44100, 48000];
let last = null;
for (const sr of rates) {
  const pcm = loadPcm('SeeYouDrop', sr);
  console.log(`\n=== ears @ ${pcm.sr} Hz  (${(pcm.n / pcm.sr).toFixed(1)} s, ${Math.floor(pcm.n / 512)} blocks)`);
  const R = stream(pcm, { ears: { pulse: { beat: (truth.bpm_grid && 60 / truth.bpm_grid.bpm) || 0.4 } } }); last = R;
  if (!has('cost')) { subRulers(R, truth, sr); percRulers(R, truth, sr); toneRulers(R, truth, sr); }
  costTable(R, sr);
  if (has('verbose')) {
    const c = {}; for (const e of R.evs) c[e.type] = (c[e.type] || 0) + 1;
    console.log('  events:', JSON.stringify(c));
    console.log('  beats where subNote disagrees (' + BADBEATS.length + '):', BADBEATS.join('  '));
  }
}
const ti = process.argv.indexOf('--trace');
if (ti > 0 && process.argv[ti + 1]) {
  const pcm = loadPcm('SeeYouDrop', last.sr);
  const t0 = process.hrtime.bigint();
  const map = buildMap(pcm.L, pcm.R, pcm.sr);
  console.log(`  map built in ${(Number(process.hrtime.bigint() - t0) / 1e9).toFixed(2)} s`);
  writeTrace(last, path.resolve(process.argv[ti + 1]), 'SeeYouDrop', map);
}
console.log(FAIL ? `\n${FAIL} FAILED` : '\nall ears rulers pass');
process.exit(FAIL ? 1 : 0);
}
