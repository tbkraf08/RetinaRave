// Live step 6 T.1 / T.2 study: the PCM beat clock (engine/clock) in node on the page's det time base, beside v3's clock.
//   node tools/clock-study.js <Track> [--out tools/work/clock/study-<Track>.json] [--no-v3] [--wsum]
// Writes a compare.py-format trace (t = heard s, 60 fps) with v3's bpm / beatPhase / beatCount MOVED onto heard time the way the
// lead does with &disp=0 (B = count + phase - DET_LEAD·bpm/60) and the PCM clock's bpmPcm / beatPhasePcm / beatCountPcm /
// clockConfPcm evaluated AT heard time — so gridcheck.py's lag rows are each clock's own error (0 = on the truth beat) — plus
// in `log`: every PCM onset { type:'pcmOnset', t (audio s), s, y, beta } and every v3 onset { type:'v3Onset', t: analysis time
// = the newest audio the analyser had seen }. --raw evaluates both at the analysis time instead (the raw clocks).
// CLOCKK='{"R_LINE":1e9}' overrides knobs.
import fs from 'node:fs';
import path from 'node:path';
import { Ears } from '../assets/engine/ears/ears.js';
import { loadPcm } from './test_ears.js';
import { detStream, makeV3, DET_LEAD, FPS, F0 } from './node-stream.js';
import { Clock, CLOCK } from '../assets/engine/clock/clock.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const a = process.argv.slice(2);
const opt = (k, d) => (a.includes(k) ? a.splice(a.indexOf(k), 2)[1] : d);
const flag = (k) => (a.includes(k) ? (a.splice(a.indexOf(k), 1), true) : false);
const V3 = !flag('--no-v3'), RAW = flag('--raw');
if (process.env.CLOCKK) Object.assign(CLOCK, JSON.parse(process.env.CLOCKK));
const track = a[0] || 'SeeYouDrop';
const OUT = opt('--out', path.join(ROOT, 'tools/work/clock', `study-${track}.json`));

const c0 = performance.now();
const pcm = loadPcm(track, 48000), sr = pcm.sr;
const ears = new Ears(sr), clk = new Clock(sr), v3 = V3 ? await makeV3(pcm) : null;
const names = ['bpm', 'beatPhase', 'beatCount', 'onset', 'bpmPcm', 'beatPhasePcm', 'beatCountPcm', 'clockConfPcm', 'pcmY1', 'pcmSd'];
const cols = Object.fromEntries(names.map((k) => [k, []]));
const t = [], f = [], log = [];
const r4 = (v) => (typeof v === 'boolean' ? (v ? 1 : 0) : Number.isFinite(v) ? +v.toFixed(5) : null);
const CLS = { kick: 0, snare: 1, hat: 2 }, seen = [-1, -1, -1];
const ev = {};
detStream(pcm, {
  block(bl, br, mono, t0) {
    ears.push(bl, br, t0);
    clk.push(mono, t0);
    // the ears' new percussion onsets (still pending release), in the order perc.js emitted them
    for (const e of ears.pending) { const c = CLS[e.type]; if (c !== undefined && e.t > seen[c]) { seen[c] = e.t; clk.onset(e.t, c, e.vel); const o = clk.lastOnset; log.push({ type: 'pcmOnset', t: +o.t.toFixed(5), cls: c, vel: +(+e.vel).toFixed(3), y: +o.y.toFixed(4), beta: +o.beta.toFixed(3) }); } }
  },
  frame(fr, heard, dt) {
    const ta = heard + DET_LEAD;
    if (v3) {
      const S = v3.step(fr, heard, dt);
      const B = RAW ? S.beatCount + S.beatPhase : S.beatCount + S.beatPhase - DET_LEAD * S.bpm / 60, n = Math.floor(B);
      cols.bpm.push(r4(S.bpm)); cols.beatPhase.push(r4(B - n)); cols.beatCount.push(n); cols.onset.push(S.onset ? 1 : 0);
      if (S.onset) log.push({ type: 'v3Onset', t: +ta.toFixed(5), s: +S.hitStrength.toFixed(3) });
    } else for (const k of ['bpm', 'beatPhase', 'beatCount', 'onset']) cols[k].push(null);
    clk.at(RAW ? ta : heard, ev);
    cols.bpmPcm.push(r4(clk.bpm)); cols.beatPhasePcm.push(r4(ev.phase)); cols.beatCountPcm.push(ev.count); cols.clockConfPcm.push(r4(clk.conf));
    cols.pcmY1.push(r4(clk.per.y1)); cols.pcmSd.push(r4(Math.sqrt(clk.P00)));
    t.push(+heard.toFixed(6)); f.push(fr + F0);
  },
});
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ track, mode: 'node', sr, at: 0, fps: FPS, detLead: DET_LEAD, fields: names, f, t, cols, log }));
console.log(`${OUT}: ${t.length} frames · pcm onsets ${clk.onsets} (hits ${clk.hits}) · est ${clk.est} lines ${clk.lines} jumps ${clk.jumps} · bpm ${clk.bpm.toFixed(2)} conf ${clk.conf.toFixed(2)} · ${((performance.now() - c0) / 1000).toFixed(1)} s`);
