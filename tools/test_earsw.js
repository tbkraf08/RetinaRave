// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// §131 THE TWO TRANSPORTS ARE THE SAME FLOATS. The ears' DSP has one implementation (`Ears`, engine/ears/ears.js) and two ways
// to reach a frame: in this thread (node, `&ears=main`, deterministic file mode) or over a port from a Worker (`EarsCore` →
// `EarsHost`, the live modes). This test streams a real track through BOTH at once, block for block, reads both at the same
// heard times and compares:
//   (i)   every one of EARS_FIELDS, every read, with Object.is — a single differing bit is a FAIL (never a tolerance)
//   (ii)  the released onsets (type, t, vel, amp) and the LOW lane the reactive drums read
//   (iii) §90's clock line THROUGH the port: a `Clock` beside each pair, fed from `onsetFeed()` exactly as features-clock.js
//         feeds it, the hook live in one and shipped as state per block in the other — the published clock must match too,
//         and the line-promoted kicks and their corrections must be non-zero, or the path was never exercised
//   (iv)  the cost of the transport on the calling thread (the copy + the protocol) beside the DSP it replaces
//   (vi)  THE ONE BEHAVIOUR A REAL PORT MOVES: in the Worker the onsets reach the PCM clock on the next main-thread task
//         after the reply — about one block (10.7 ms at 48 kHz) after the hop that found them, where in this thread the clock
//         reads them inside that same block. Each onset still carries its own sample-exact time, so what is late is the
//         ARRIVAL of a right measurement (an out-of-sequence Kalman update), not the measurement. This lane runs the
//         in-process ears with the clock fed one block late and prints what the published clock does differently.
//   (v)   the REAL Worker entry (assets/engine/ears/worker.js) started in node through a web-shaped scope: the frames of a
//         block round-tripped over a real port are bit-identical to the in-process ones
//   node tools/test_earsw.js [--secs=60] [--track=SeeYouDrop] [--sr=48000]
import path from 'node:path';
import { Worker } from 'node:worker_threads';
import { loadPcm } from './test_ears.js';
import { Ears, EARS_FIELDS } from '../assets/engine/ears/ears.js';
import { EarsCore } from '../assets/engine/ears/core.js';
import { EarsHost, EARSK } from '../assets/engine/ears/host.js';
import { Clock, lineHook } from '../assets/engine/clock/clock.js';

const arg = (k, d) => { const a = process.argv.find((v) => v.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const SECS = +arg('secs', 60), TRACK = arg('track', 'SeeYouDrop'), SR = +arg('sr', 48000);
const B = 512, CLS = { kick: 0, snare: 1, hat: 2 };
let FAIL = 0;
const ok = (name, pass, value, target) => {
  if (!pass) FAIL++;
  console.log('  ' + (pass ? 'pass' : 'FAIL') + '  ' + name.padEnd(46) + String(value).padEnd(32) + (target || ''));
};

// THE PORT, in this thread: an `EarsCore` whose sink is the host's own `frames` handler, called synchronously. The protocol
// and the ingestion are the page's; only the thread (and so the arrival delay) is not.
let CORE = null, CORE_MS = 0;
EARSK.make = (onmessage) => {
  CORE = new EarsCore((m) => onmessage(m));
  return { postMessage: (m) => { const a = process.hrtime.bigint(); CORE.handle(m); CORE_MS += Number(process.hrtime.bigint() - a) / 1e6; } };
};

// one stream: the ears (either transport) with a Clock beside them, fed as features-clock.js feeds it
function lane(sr, make, delay) {
  const E = make(sr), clk = new Clock(sr);
  E.setLine(lineHook(clk), clk);
  // `line` / `fix`: the DISTINCT onset times seen promoted on the clock's line and then corrected back (§90). Sets, because the
  // two lanes offer the clock different lists — the pending one, drained by every read, and the host's 1 s arrival buffer.
  return { E, clk, seen: [-1, -1, -1], st: { n: null }, mono: new Float32Array(B), line: new Set(), fix: new Set(), delay: !!delay, q: [] };
}
function block(L, R, t0, X) {
  X.E.setVoxSkip(false);
  X.E.push(L, R, t0);
  const m = X.mono;
  for (let i = 0; i < L.length; i++) m[i] = 0.5 * (L[i] + R[i]);
  X.clk.push(L.length === m.length ? m : m.subarray(0, L.length), t0);
  let p = X.E.onsetFeed();
  if (X.delay) { const prev = X.q; X.q = p.slice(); p = prev; }   // (vi): the clock sees the previous block's onsets
  for (let i = 0; i < p.length; i++) {
    const e = p[i], c = CLS[e.type];
    if (e.line === true) X.line.add(e.t);
    if (c !== undefined && !e.line && e.t > X.seen[c]) { X.seen[c] = e.t; X.clk.onset(e.t, c, e.vel); if (e.line === false) X.fix.add(e.t); }
  }
}

const pcm = loadPcm(TRACK, SR);
const sr = pcm.sr, nEnd = Math.min(pcm.n, Math.ceil(SECS * sr));
console.log(`== §131 the two transports (${TRACK} @ ${sr}, ${SECS} s, 60 fps reads)`);
const A = lane(sr, (s) => new Ears(s));                 // in this thread
const D = lane(sr, (s) => new Ears(s), true);           // (vi) in this thread, the clock fed one block late
const Wl = lane(sr, (s) => new EarsHost(s));            // over the port
ok('(0) the host has a port', !Wl.E.failed && Wl.E.worker === true, Wl.E.failed ? 'failed' : 'ready');

const bl = new Float32Array(B), br = new Float32Array(B);
let bad = 0, badField = '', reads = 0, evA = 0, evW = 0, evBad = 0, lowA = 0, lowW = 0, lowBad = 0;
let next = 0, msA = 0, msW = 0, blocks = 0, dBpm = 0, dPh = 0, dN = 0, cbad = 0, cFirst = '';
for (let s = 0; s + B <= nEnd; s += B) {
  bl.set(pcm.L.subarray(s, s + B)); br.set(pcm.R.subarray(s, s + B));
  const t0 = s / sr;
  let a = process.hrtime.bigint(); block(bl, br, t0, A); msA += Number(process.hrtime.bigint() - a) / 1e6;
  a = process.hrtime.bigint(); block(bl, br, t0, Wl); msW += Number(process.hrtime.bigint() - a) / 1e6;
  block(bl, br, t0, D);
  blocks++;
  const tEnd = (s + B) / sr;
  while (next <= tEnd) {
    const oA = A.E.read(next), oW = Wl.E.read(next);
    reads++;
    for (const f of EARS_FIELDS) {
      if (!Object.is(oA[f], oW[f])) {
        bad++;
        if (!badField) badField = `${f} @ ${next.toFixed(3)} s: ${oA[f]} vs ${oW[f]}`;
      }
    }
    // the released onsets and the LOW lane
    const ea = A.E.events, ew = Wl.E.events;
    evA += ea.length; evW += ew.length;
    if (ea.length !== ew.length) evBad++;
    else for (let i = 0; i < ea.length; i++) if (ea[i].type !== ew[i].type || !Object.is(ea[i].t, ew[i].t) || !Object.is(ea[i].vel, ew[i].vel) || !Object.is(ea[i].amp, ew[i].amp)) evBad++;
    const la = A.E.lowReleased, lw = Wl.E.lowReleased;
    lowA += la.length; lowW += lw.length;
    if (la.length !== lw.length) lowBad++;
    else for (let i = 0; i < la.length; i++) if (!Object.is(la[i].t, lw[i].t) || !Object.is(la[i].fl, lw[i].fl)) lowBad++;
    // (iii) the published PCM clock on both lanes
    const ca = A.clk.read(next, A.st, {}), cw = Wl.clk.read(next, Wl.st, {});
    if (!Object.is(ca.bpm, cw.bpm) || !Object.is(ca.phase, cw.phase) || !Object.is(ca.count, cw.count)) { cbad++; if (!cFirst) cFirst = `@ ${next.toFixed(3)} s: ${ca.bpm}/${ca.phase} vs ${cw.bpm}/${cw.phase}`; }
    const cd = D.clk.read(next, D.st, {});
    if (next > 20) {                                     // from 20 s: both clocks are locked (the cold start is 12-15 s)
      dN++;
      const db = Math.abs(cd.bpm - ca.bpm); if (db > dBpm) dBpm = db;
      const bps = ca.bpm / 60, dp = Math.abs(cd.phase - ca.phase);
      const ph = 1000 * Math.min(dp, 1 - dp) / Math.max(bps, 1e-6); if (ph > dPh) dPh = ph;
    }
    next += 1 / 60;
  }
}
ok('(i) every EARS_FIELDS value, every read', bad === 0, `${reads} reads × ${EARS_FIELDS.length} fields, ${bad} differ`, badField || 'max |Δ| 0');
ok('(ii) the released onsets', evBad === 0 && evA === evW && evA > 0, `${evA} vs ${evW} events, ${evBad} differ`, 'identical');
ok('(ii) the LOW lane (the reactive drums\' own)', lowBad === 0 && lowA === lowW && lowA > 0, `${lowA} vs ${lowW} onsets, ${lowBad} differ`, 'identical');
ok('(iii) the PCM clock published on both lanes', cbad === 0, `${reads} reads, ${cbad} differ`, cFirst || 'identical');
// §90's promoted kicks are what the port's line state has to reproduce; the ticks are every onset the clock was handed. Both
// counts must agree — a track whose 40 s window promotes none (Vienna) proves nothing about the line and says so.
ok('(iii) §90: the line and the ticks agree', A.line.size === Wl.line.size && A.fix.size === Wl.fix.size && A.fix.size > 0,
  `line kicks ${A.line.size} vs ${Wl.line.size}${A.line.size ? '' : ' (none in this window)'}, ticks ${A.fix.size} vs ${Wl.fix.size}`, 'equal, ticks > 0');
console.log(`  (vi)  the clock fed one block late (what a real port moves, ${dN} reads from 20 s): max |Δbpm| ${dBpm.toFixed(3)}, ` +
  `max |Δ beat phase| ${dPh.toFixed(1)} ms — the onsets' own times are unchanged, only when the filter sees them`);
console.log(`  cost  per block over ${blocks} blocks: in-thread ears+clock ${(msA / blocks).toFixed(3)} ms · host+clock ${(msW / blocks).toFixed(3)} ms ` +
  `(the port's own DSP ${(CORE_MS / blocks).toFixed(3)} ms of it, so the transport is ${((msW - CORE_MS) / blocks).toFixed(3)} ms on the caller's thread)`);

// (v) the real Worker entry, over a real port
const frames = (m) => ({ nf: m.nf, t: Array.from(m.t || []), v: Array.from(m.v || []), ev: m.ev.map((e) => [e.type, e.t, e.vel]) });
const ref = [];
{
  const core = new EarsCore((m) => ref.push(frames(m)));
  core.handle({ k: 'init', gen: 1, sr });
  for (let s = 0, n = 0; s + B <= nEnd && n < 400; s += B, n++) {
    core.handle({ k: 'b', gen: 1, t0: s / sr, skip: false, line: null, L: pcm.L.slice(s, s + B), R: pcm.R.slice(s, s + B) });
  }
}
const w = new Worker(path.join(import.meta.dirname, 'ears-worker-node.js'));
const got = [];
const done = new Promise((res, rej) => {
  w.on('message', (m) => { if (m.k === 'f') { got.push(frames(m)); if (got.length === ref.length) res(); } });
  w.on('error', rej);
  setTimeout(() => res(), 20000);
});
w.postMessage({ k: 'init', gen: 1, sr });
for (let s = 0, n = 0; s + B <= nEnd && n < 400; s += B, n++) {
  const L = pcm.L.slice(s, s + B), R = pcm.R.slice(s, s + B);
  w.postMessage({ k: 'b', gen: 1, t0: s / sr, skip: false, line: null, L, R }, [L.buffer, R.buffer]);
}
await done;
await w.terminate();
let wbad = 0, wv = 0;
for (let i = 0; i < ref.length; i++) {
  const a = ref[i], b = got[i];
  if (!b || a.nf !== b.nf || a.t.length !== b.t.length || a.ev.length !== b.ev.length) { wbad++; continue; }
  for (let k = 0; k < a.t.length; k++) if (!Object.is(a.t[k], b.t[k])) wbad++;
  for (let k = 0; k < a.v.length; k++) { wv++; if (!Object.is(a.v[k], b.v[k])) wbad++; }
  for (let k = 0; k < a.ev.length; k++) if (a.ev[k][0] !== b.ev[k][0] || !Object.is(a.ev[k][1], b.ev[k][1])) wbad++;
}
ok('(v) assets/engine/ears/worker.js over a real port', got.length === ref.length && wbad === 0,
  `${got.length}/${ref.length} blocks, ${wv} floats, ${wbad} differ`, 'identical');

console.log(FAIL ? `\n${FAIL} FAILED` : '\ntest_earsw: OK');
process.exit(FAIL ? 1 : 0);
