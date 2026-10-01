// THE COLD-START TABLE (DECISIONS §76 phase 2): the PCM beat clock started cold at several points of each truth track, in
// node on the det time base, graded against the truth grid — the receipt the plan asks for before `LAT_SRC 'tongue'` may
// become the default. Per start: did the line land on the truth LATTICE (the median lag over the last 30 s within ±0.25
// beat of 0), when did it lock (the first truth beat after which |lag| < 0.1 beat holds for 8 s), the lag p50 / p90 and the
// share within 30 ms over the run from 15 s after the start, and the lattice moves (clock.latJumps) and comb-line jumps.
//   node tools/tongues-cold.js [Track …] [--starts 10,25,40,55,70,85,100,115,130,145] [--md out.md]
//   CLOCKK='{"LAT_SRC":"tongue"}' node tools/tongues-cold.js            # the knob on; the default run is §59's rule
import fs from 'node:fs';
import path from 'node:path';
import { Ears } from '../assets/engine/ears/ears.js';
import { loadPcm } from './test_ears.js';
import { detStream } from './node-stream.js';
import { Clock, CLOCK } from '../assets/engine/clock/clock.js';
import { Tongues, TONGUEK } from '../assets/engine/clock/tongues.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const a = process.argv.slice(2);
const opt = (k, d) => (a.includes(k) ? a.splice(a.indexOf(k), 2)[1] : d);
const MD = opt('--md', null);
const STARTS = opt('--starts', '10,25,40,55,70,85,100,115,130,145').split(',').map(Number);
if (process.env.CLOCKK) Object.assign(CLOCK, JSON.parse(process.env.CLOCKK));
const TRACKS = a.length ? a : ['SeeYouDrop', 'CyborgNinja', 'WhoLikesToParty', 'Malicious', 'Vienna'];
const GRADE_FROM = 15, LOCK_HOLD = 8, LOCK_TOL = 0.1;
const lines = [];
const say = (s = '') => { console.log(s); lines.push(s); };
const med = (xs) => { const s = [...xs].sort((x, y) => x - y); return s.length ? s[s.length >> 1] : NaN; };
const pct = (xs, p) => { const s = [...xs].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : NaN; };

say(`# cold starts — LAT_SRC ${CLOCK.LAT_SRC}, starts at ${STARTS.join(' ')} s`);
say('| track | start | lattice | lock s | lag p50 / p90 ms | within 30 ms | lat moves | line jumps |');
say('|---|---|---|---|---|---|---|---|');
const agg = {};
for (const track of TRACKS) {
  const full = loadPcm(track, 48000), sr = full.sr;
  const truth = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/truth', track + '.json'), 'utf8'));
  const dur = full.n / sr;
  for (const at of STARTS) {
    if (at + 45 > dur) continue;
    const s0 = Math.round(at * sr), pcm = { L: full.L.subarray(s0), R: full.R.subarray(s0), n: full.n - s0, sr };
    const beats = truth.beats.map((b) => b - at).filter((b) => b > 0);
    const ears = new Ears(sr), clk = new Clock(sr), CLS = { kick: 0, snare: 1, hat: 2 }, seen = [-1, -1, -1];
    if (TONGUEK.on) clk.tongues = new Tongues(TONGUEK);
    const hopT = [], hopB = [], hopF = [];
    const hop0 = clk.hop.bind(clk);
    clk.hop = (tt) => { hop0(tt); hopT.push(tt); hopB.push(clk.b); hopF.push(clk.f); };
    detStream(pcm, {
      block(bl, br, mono, t0) {
        clk.push(mono, t0); ears.push(bl, br, t0);
        for (const e of ears.pending) { const c = CLS[e.type]; if (c !== undefined && e.t > seen[c]) { seen[c] = e.t; clk.onset(e.t, c, e.vel); } }
      },
      frame(fr, heard) { ears.read(heard); },
    });
    // the clock at each truth beat: b(tb) from the first hop at or after tb, run back at the rate
    let j = 0; const lag = [], tb = [];
    for (const b of beats) {
      while (j < hopT.length && hopT[j] < b) j++;
      if (j >= hopT.length) break;
      const bb = hopB[j] - hopF[j] * (hopT[j] - b), d = bb - Math.round(bb);
      lag.push(-d / hopF[j] * 1000); tb.push(b);
    }
    const bpsT = truth.bpm_grid.bpm / 60;
    const late = lag.filter((_, i) => tb[i] >= tb[tb.length - 1] - 30), mLate = med(late);
    const lattice = Math.abs(mLate) < 0.25 / bpsT * 1000 ? 'truth' : 'HALF';
    let lock = NaN;
    for (let i = 0; i < tb.length; i++) {
      let k = i; while (k < tb.length && tb[k] < tb[i] + LOCK_HOLD) k++;
      if (k >= tb.length) break;
      if (lag.slice(i, k).every((x) => Math.abs(x) < LOCK_TOL / bpsT * 1000)) { lock = tb[i]; break; }
    }
    const gr = lag.filter((_, i) => tb[i] >= GRADE_FROM), abs = gr.map(Math.abs);
    const within = gr.length ? gr.filter((x) => Math.abs(x) <= 30).length / gr.length * 100 : NaN;
    say(`| ${track} | ${at} | ${lattice} | ${lock === lock ? lock.toFixed(1) : '—'} | ${med(gr).toFixed(0)} / ${pct(abs, 0.9).toFixed(0)} | ${within.toFixed(1)} % | ${clk.latJumps} | ${clk.jumps - clk.latJumps} |`);
    const g = agg[track] || (agg[track] = { n: 0, truth: 0, lock: [], w30: [], p90: [], moves: 0 });
    g.n++; if (lattice === 'truth') g.truth++; g.lock.push(lock === lock ? lock : 99); g.w30.push(within); g.p90.push(pct(abs, 0.9)); g.moves += clk.latJumps;
  }
}
say();
say('| track | starts on the truth lattice | lock s p50 (max) | within 30 ms p50 | lag p90 p50 | lattice moves |');
say('|---|---|---|---|---|---|');
for (const t in agg) { const g = agg[t]; say(`| ${t} | ${g.truth} / ${g.n} | ${med(g.lock).toFixed(1)} (${Math.max(...g.lock).toFixed(1)}) | ${med(g.w30).toFixed(1)} % | ${med(g.p90).toFixed(0)} | ${g.moves} |`); }
if (MD) fs.writeFileSync(MD, lines.join('\n') + '\n');
