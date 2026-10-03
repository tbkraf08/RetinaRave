// The TONGUES in node (DECISIONS §76): a track's decoded PCM through the PCM beat clock exactly as features-clock.js feeds it
// (the mono block per 512, then the ears' new onsets), with an engine/clock/tongues.js Tongues attached — the plan's probe
// table (docs/plans/TONGUES-PLAN.md §3) re-taken with the bank centred on the CLOCK's beat instead of the truth grid's.
//   node tools/tongues-node.js [Track ...] [--out tools/work/tongues] [--md out.md]     # -> <out>/node-<Track>.json + the table
// Per frame (the page's det time base, tools/node-stream.js): the twelve fields at the analysers' time, the trace's shape
// (build-node.js --cmp grades page = node on them). Per clock beat: the fields at that beat. The grading against the truth
// grid (tools/truth/<T>.json) is the probe's: the Ω = 1 oscillator's phase at the truth beats (lock phase, R), the medians
// over the graded beats from WARM s, the ambiguity runs (≥ 8 beats of tongueAmbig ≥ AMB), and the time to lock.
import fs from 'node:fs';
import path from 'node:path';
import { Ears } from '../assets/engine/ears/ears.js';
import { loadPcm } from './test_ears.js';
import { detStream, DET_LEAD, FPS, F0 } from './node-stream.js';
import { Clock, CLOCK, lineHook } from '../assets/engine/clock/clock.js';
import { Tongues, TONGUEK, TONGUE_FIELDS } from '../assets/engine/clock/tongues.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const a = process.argv.slice(2);
const opt = (k, d) => (a.includes(k) ? a.splice(a.indexOf(k), 2)[1] : d);
const OUT = opt('--out', path.join(ROOT, 'tools/work/tongues'));
const MD = opt('--md', null);
const AMB = +opt('--amb', 0.95);
if (process.env.CLOCKK) Object.assign(CLOCK, JSON.parse(process.env.CLOCKK));
if (process.env.TONGUEK) Object.assign(TONGUEK, JSON.parse(process.env.TONGUEK));
const TRACKS = a.length ? a : ['SeeYouDrop', 'CyborgNinja', 'WhoLikesToParty', 'Malicious', 'Vienna'];
const WARM = 8;
const r4 = (v) => (typeof v === 'boolean' ? (v ? 1 : 0) : Number.isFinite(v) ? +v.toFixed(4) : null);
const med = (xs) => { const s = xs.filter((x) => x === x).sort((x, y) => x - y); return s.length ? (s.length & 1 ? s[s.length >> 1] : 0.5 * (s[s.length / 2 - 1] + s[s.length / 2])) : NaN; };
const pct = (xs, p) => { const s = xs.filter((x) => x === x).sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : NaN; };
const lines = [];
const say = (s = '') => { console.log(s); lines.push(s); };

say(`# tongues in the engine — K ${TONGUEK.K}, window ${TONGUEK.WIN} beats, bank centred on the clock (Ω 0.25..4, 1/${1 / TONGUEK.OCT_STEP} oct + p/q, q<=${TONGUEK.QMAX})`);
say('| track | 1:1 wins | d 1:1 p50 (p10) | d 2:1 | d 4:1 | w 1:1 oct (K impl) | low d 1:1 | lock phase mid / low (ms) | R | swing | ambig >= ' + AMB + ' runs | first full window | tongues µs/hop |');
say('|---|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const track of TRACKS) {
  const c0 = performance.now();
  const pcm = loadPcm(track, 48000), sr = pcm.sr, ears = new Ears(sr);
  const clk = new Clock(sr), tg = new Tongues(), CLS = { kick: 0, snare: 1, hat: 2 }, seen = [-1, -1, -1], cpub = { n: null }, cev = {};
  ears.perc.line = lineHook(clk);   // §90: the kick lane reads the clock's line (page = node)
  clk.tongues = tg;
  const truth = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/truth', track + '.json'), 'utf8'));
  const beats = truth.beats, fBeat = truth.bpm_grid.bpm / 60;
  const names = ['bpmPcm', 'beatPhasePcm', 'beatCountPcm', ...TONGUE_FIELDS];
  const cols = Object.fromEntries(names.map((k) => [k, []]));
  const t = [], f = [], hopT = [], hopM = [], hopL = [], hopB = [], perBeat = [];
  let tgUs = 0, lastBeats = 0, eased = 0;
  const hop0 = clk.hop.bind(clk), tgHop = tg.hop.bind(tg);
  tg.hop = (...x) => { const h0 = performance.now(); tgHop(...x); tgUs += performance.now() - h0; };
  clk.hop = (tt) => { hop0(tt); hopT.push(tt); hopM.push(tg.mid.th[tg.i1]); hopL.push(tg.low.th[tg.low.i1]); hopB.push(clk.b); if (tg.beats !== lastBeats) { lastBeats = tg.beats; perBeat.push({ t: tt, w11: tg.w11, ...tg.out }); } };
  detStream(pcm, {
    block(bl, br, mono, t0) {
      clk.push(mono, t0);
      ears.push(bl, br, t0);
      for (const e of ears.pending) { const c = CLS[e.type]; if (c !== undefined && !e.line && e.t > seen[c]) { seen[c] = e.t; clk.onset(e.t, c, e.vel); } }
    },
    frame(fr, heard) {
      clk.read(heard + DET_LEAD, cpub, cev);
      cols.bpmPcm.push(r4(cev.bpm)); cols.beatPhasePcm.push(r4(cev.phase)); cols.beatCountPcm.push(cev.count);
      for (const k of TONGUE_FIELDS) cols[k].push(r4(tg.out[k]));
      eased += (tg.out.tongueDepth - eased) * (1 - Math.exp(-(1 / FPS) / TONGUEK.EASE)); cols.tongueDepth[cols.tongueDepth.length - 1] = r4(eased);   // the page's per-frame ease (features-tongues.js)
      ears.read(heard);
      t.push(+heard.toFixed(6)); f.push(fr + F0);
    },
  });
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, `node-${track}.json`), JSON.stringify({ track, mode: 'node', sr, at: 0, fps: FPS, detLead: DET_LEAD, fields: names, f, t, cols, log: [], beats: perBeat }));
  // --- the grading, the probe's way, on the clock-centred bank
  const graded = perBeat.filter((r) => r.t >= WARM + TONGUEK.WIN / fBeat && r.tongueOn === 1);
  const col = (k) => graded.map((r) => r[k]);
  const wins = graded.length ? graded.filter((r) => r.tongueP === 1 && r.tongueQ === 1).length / graded.length * 100 : NaN;
  const idxAt = (tt) => { let lo = 0, hi = hopT.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (hopT[m] <= tt) lo = m; else hi = m - 1; } return lo; };
  const lockPhase = (arr) => {   // the Ω = 1 oscillator's phase at the truth beats (from WARM + a window): circular mean -> [ms, R]
    let x = 0, y = 0, n = 0;
    for (const b of beats) { if (b < WARM + TONGUEK.WIN / fBeat) continue; const i = idxAt(b); const ph = arr[i] - Math.floor(arr[i]); x += Math.cos(2 * Math.PI * ph); y += Math.sin(2 * Math.PI * ph); n++; }
    const th = Math.atan2(y, x) / (2 * Math.PI);
    return [-th / fBeat * 1000, Math.hypot(x, y) / Math.max(1, n)];
  };
  const [lagM, RM] = lockPhase(hopM), [lagL] = lockPhase(hopL);
  // ambiguity runs: >= 8 consecutive clock beats with tongueAmbig >= AMB (the full windows only)
  const runs = []; let i = 0;
  const full = perBeat.filter((r) => r.tongueOn === 1 && r.t >= WARM);
  while (i < full.length) { if (full[i].tongueAmbig >= AMB) { let j = i; while (j + 1 < full.length && full[j + 1].tongueAmbig >= AMB) j++; if (j - i + 1 >= 8) runs.push(`${full[i].t.toFixed(1)}-${full[j].t.toFixed(1)} (${j - i + 1})`); i = j + 1; } else i++; }
  const first = perBeat.find((r) => r.tongueOn === 1);
  const share = full.length ? full.filter((r) => r.tongueAmbig >= AMB).length / full.length * 100 : NaN;
  const us = tgUs * 1000 / clk.hops;
  say(`| ${track} ${truth.bpm_grid.bpm.toFixed(0)} | ${wins.toFixed(0)} % | ${med(col('tongue11')).toFixed(3)} (${pct(col('tongue11'), 0.1).toFixed(3)}) | ${med(col('tongue21')).toFixed(3)} | ${med(col('tongue41')).toFixed(3)} | ` +
    `${med(col('w11')).toFixed(3)} (${med(col('tongueK')).toFixed(2)}) | ${med(col('tongueLatConf')).toFixed(3)} | ` +
    `${lagM >= 0 ? '+' : ''}${lagM.toFixed(0)} / ${lagL >= 0 ? '+' : ''}${lagL.toFixed(0)} | ${RM.toFixed(3)} | ${med(col('swing')).toFixed(3)} | ${runs.join(', ') || 'none'} (${share.toFixed(1)} % of beats) | ${first ? first.t.toFixed(1) : '—'} s | ${us.toFixed(2)} |`);
  console.error(`  ${track}: ${t.length} frames · ${perBeat.length} clock beats · ${((performance.now() - c0) / 1000).toFixed(1)} s`);
}
if (MD) fs.writeFileSync(MD, lines.join('\n') + '\n');
