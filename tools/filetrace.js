// Record a window of a real track, deterministically, into the trace JSON tools/truth/compare.py reads (v0.15 E1/E2).
//   node tools/filetrace.js <track> <t0> <t1> <out.json> [fields='*'] [extraHash]
// e.g. PORT=8812 node tools/filetrace.js SeeYouDrop 0 60 tools/work/file-det-a.json
//      PORT=8812 RT=1 node tools/filetrace.js SeeYouDrop 0 60 tools/work/file-rt-a.json 'bass,eS,kick,beatPhase,bpm'
//
// CLOCK=1 GPU=1 cdp on '#test&track=<track>&at=<t0−WARM>&scene=0': WARM seconds of engine warm-up run before t0 so the
// followers, the tempo estimator and the synapse grid are not cold at the first recorded frame; the recorded window is
// [t0, t1] in HEARD time (MS.heardT, the trace's `t`). RT=1 drops CLOCK and records the real-time path instead
// (mode 'file-rt'); &det=0 is added so a headed run behaves the same way. WARM=0 records a cold start (live step 3 warm-up:
// the engine's first seconds are exactly what the ruler grades).
//
// The deterministic recipe, which every real-track run must follow (docs/HARNESS.md "File source"):
//   engine/sources/file.js holds the frame clock at frame 1 while the track decodes, so frame0 is 2 on every run. The
//   driver releases the clock with {eval:"window.__PAUSE=0"} — NEVER {wait}, which clears window.__pauseAt along with it
//   and lets the page run a decode's worth of frames, moving core/loop.js's `wall` and with it every screenshot.
//
// The JSON comes back in chunks: one Runtime.evaluate returning ~8 MB is at the mercy of the CDP message limit, so the
// page stringifies once into window.__tj and the driver slices CHUNK characters at a time (measured: a 60 s '*' trace of
// SeeYouDrop is ~5.6 MB / 15 chunks; MAX_CHUNKS caps it at 16 MB, and the driver fails loudly if the string is longer).
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WARM = process.env.WARM === undefined ? 8 : +process.env.WARM;  // s of engine warm-up before t0 (WARM=0: a cold start AT t0)
const FPS = 60;              // the deterministic clock's rate (assets/engine/sources/file.js FPS)
const F0 = 2;                // the frame the playhead starts on: file.js holds the clock at DET_HOLD_FRAME = 1, so f0 = 2
const CHUNK = 400000;        // characters per chunk eval
const MAX_CHUNKS = 40;       // 16 MB

const [track, t0s, t1s, out, fieldsArg, extraHash] = process.argv.slice(2);
if (!track || t0s === undefined || t1s === undefined || !out) {
  console.error('usage: node tools/filetrace.js <track> <t0> <t1> <out.json> [fields=*] [extraHash]');
  process.exit(2);
}
const t0 = +t0s, t1 = +t1s, rt = !!process.env.RT;
const fields = !fieldsArg || fieldsArg === '*' ? '*' : fieldsArg.split(',').map((s) => s.trim()).filter(Boolean);
const at = Math.max(0, t0 - WARM);
const hash = 'test&track=' + track + '&at=' + at + '&scene=0' + (rt ? '&det=0' : '') + (extraHash || '');

// In deterministic mode the window is addressed by FRAME, not by a heardT predicate: heardT = at + (f − f0)/60 exactly, and
// cdp's __FRAME targets stop the clock on the frame asked for, while a general {until} only stops it at the next 40 ms poll
// — by which time a different number of frames has run in each run and the two traces would not even be the same length.
const fOf = (T) => F0 + Math.round((T - at) * FPS);
const fStart = fOf(t0), fEnd = fOf(t1);
const head = 'JSON.stringify({f0:CARD.ENGINE.AU.file.frame0,sr:CARD.ENGINE.AU.file.sr,dur:CARD.ENGINE.AU.file.dur,det:CARD.ENGINE.AU.file.det,at:CARD.ENGINE.AU.file.at,lat:CARD.ENGINE.AU.lat()})';
const START = 'CARD.TRACE.start(' + JSON.stringify(fields) + '), CARD.ENGINE.frameN';
const STOP = '(()=>{const j=CARD.TRACE.stop();window.__tj=JSON.stringify(j);return JSON.stringify({len:window.__tj.length,frames:j.f.length,fields:j.fields.length,mode:j.mode,log:j.log.length,t0:j.t[0],t1:j.t[j.t.length-1],cpu:+CARD.ENGINE.ms.toFixed(3),an:CARD.ENGINE.AU.fast.analyses||null,blocks:CARD.ENGINE.AU.file.pushed})})()';
// CLOCKK='{"LAT_MARG":1e9}' overrides the PCM clock's knobs (ENGINE.CLOCK.K = engine/clock/clock.js's CLOCK) before the
// audio opens — the same env the node tools take (clock-study.js, test_clock.js), so an engine A/B of one knob is one run
// each instead of two trees (§59: LAT_MARG 1e9 turns the lattice check off and gives §56's published clock exactly).
const KNOBS = process.env.CLOCKK ? JSON.parse(process.env.CLOCKK) : null;
const steps = [
  { until: 'window.CARD', timeout: 60000 },
  ...(KNOBS ? [{ eval: 'Object.assign(CARD.ENGINE.CLOCK.K, ' + JSON.stringify(KNOBS) + '), JSON.stringify(CARD.ENGINE.CLOCK.K)' }] : []),
  { until: 'window.CARD.ENGINE.AU.file && window.CARD.ENGINE.AU.file.open', timeout: 300000 },
  { eval: head },
  ...(rt
    ? [{ wait: 50 }, { until: 'CARD.MS.heardT >= ' + t0, timeout: 600000 }, { eval: START },
       { wait: 50 }, { until: 'CARD.MS.heardT >= ' + t1, timeout: 900000 }]
    : [{ until: 'window.__FRAME>=' + (fStart - 1), timeout: 900000 }, { eval: START },
       { until: 'window.__FRAME>=' + fEnd, timeout: 900000 }]),
  { eval: STOP },
  ...Array.from({ length: MAX_CHUNKS }, (_, i) => ({ eval: `window.__tj.slice(${i * CHUNK},${(i + 1) * CHUNK})` })),
];

const env = Object.assign({}, process.env, { GPU: '1', OUT: path.join(HERE, 'work') });
if (rt) delete env.CLOCK; else env.CLOCK = '1';

const ch = spawn('node', [path.join(HERE, 'cdp.js'), hash, JSON.stringify(steps)], { env, maxBuffer: 1 << 28 });
let buf = '';
ch.stdout.on('data', (d) => (buf += d));
ch.stderr.on('data', (d) => process.stderr.write(d));
ch.on('exit', (code) => {
  const lines = buf.split('\n');
  const evals = lines.filter((l) => l.startsWith('EVAL ')).map((l) => l.slice(l.indexOf('=> ') + 3));
  const errs = lines.filter((l) => l.startsWith('[EXC]') || l.startsWith('[console.error]') || l.startsWith('TIMEOUT') || l.startsWith('[EVAL-ERR]'));
  const un = (s) => { try { return JSON.parse(s); } catch (e) { return null; } };
  const dbl = (s) => un(un(s || 'null') || 'null');
  const H = dbl(evals[KNOBS ? 1 : 0]);                         // the f0 / sr / dur / latency eval (CLOCKK adds one {eval} before it)
  const meta = dbl(evals[evals.length - MAX_CHUNKS - 1]);
  if (errs.length) console.log('page errors:', errs.slice(0, 4).join(' | '));
  if (!meta) { console.log('filetrace: no trace came back (exit ' + code + ')'); console.log(lines.slice(-12).join('\n')); process.exit(1); }
  if (!rt && H && H.f0 !== F0) console.log(`filetrace: WARNING frame0 is ${H.f0}, not ${F0} — the window is off by ${(H.f0 - F0) / FPS} s and two runs may differ`);
  const json = evals.slice(evals.length - MAX_CHUNKS).map((s) => un(s) || '').join('');
  if (json.length !== meta.len) {
    console.log(`filetrace: got ${json.length} of ${meta.len} characters — raise MAX_CHUNKS (${MAX_CHUNKS}×${CHUNK})`);
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  fs.writeFileSync(out, json);
  console.log(`${out}: ${meta.frames} frames · ${meta.fields} fields · heard ${meta.t0} → ${meta.t1} s · mode ${meta.mode} · f0 ${H ? H.f0 : '?'} · sr ${H ? H.sr : '?'} · log ${meta.log} · ENGINE.ms ${meta.cpu} · ${(meta.len / 1048576).toFixed(2)} MB · ${((meta.len / 1048576) / (meta.frames / FPS) * 60).toFixed(2)} MB/min`);
  if (H && H.lat) console.log(`  latency: outputLatency ${H.lat.out} · baseLatency ${H.lat.base} · currentTime ${H.lat.now} · contextTime ${H.lat.ctxT} · heard ${H.lat.heard}`);
  process.exit(errs.length ? 1 : 0);
});
