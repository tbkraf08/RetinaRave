// One CHLADNI acceptance window on a real track, deterministically (v0.15, docs/workers/brief-chladni.md step 7).
//
//   PORT=8814 node tools/accept/v0.15/chwin.js <track> <t0> <t1> <tag> [shots=t,t,…] [fields=*] [extraHash]
//
// It is tools/filetrace.js's recipe with two differences: the forced scene is 11 (filetrace pins scene 0), and it takes
// SHOTS at named heard times inside the window, so one run gives both the per-frame numbers the window is judged on and
// the montage frames. Everything else is the four rules of a deterministic real-track run (docs/HARNESS.md "File
// source"): WARM seconds of engine warm-up before t0, frame0 = 2 so heardT = at + (frame − 2)/60 exactly, the window
// addressed by __FRAME and never by a heardT predicate, and the clock released only by a __FRAME target.
//
// Output: tools/work/<tag>.json (the CARD.TRACE JSON tools/truth/compare.py's format) and tools/work/<tag>-NN.jpg per
// shot. The scene's own numbers are read through CARD.REG[11].scene.hooks.info() at each shot, printed beside it.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const WARM = +(process.env.WARM || 8);   // s of engine warm-up before t0 (the brief: "&at= starts the engine cold").
                             // A window whose look depends on the latched tonic warms longer: WARM=20 node …
const FPS = 60;
const F0 = 2;
const CHUNK = 400000;
const MAX_CHUNKS = 40;

const [track, t0s, t1s, tag, shotsArg, fieldsArg, extraHash] = process.argv.slice(2);
if (!track || t0s === undefined || t1s === undefined || !tag) {
  console.error('usage: node tools/accept/v0.15/chwin.js <track> <t0> <t1> <tag> [shots=t,t,…] [fields=*] [extraHash]');
  process.exit(2);
}
const t0 = +t0s, t1 = +t1s;
const at = Math.max(0, t0 - WARM);
const shots = (shotsArg && shotsArg !== '-' ? shotsArg.split(',') : []).map(Number).filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
const fields = !fieldsArg || fieldsArg === '*' || fieldsArg === '-' ? '*' : fieldsArg.split(',').map((s) => s.trim()).filter(Boolean);
const hash = 'test&track=' + track + '&at=' + at + '&scene=11' + (extraHash || '');
const fOf = (T) => F0 + Math.round((T - at) * FPS);
const fStart = fOf(t0), fEnd = fOf(t1);

const head = 'JSON.stringify({f0:CARD.ENGINE.AU.file.frame0,sr:CARD.ENGINE.AU.file.sr,det:CARD.ENGINE.AU.file.det,at:CARD.ENGINE.AU.file.at})';
const START = 'CARD.TRACE.start(' + JSON.stringify(fields) + '), CARD.ENGINE.frameN';
const STOP = '(()=>{const j=CARD.TRACE.stop();window.__tj=JSON.stringify(j);return JSON.stringify({len:window.__tj.length,frames:j.f.length,fields:j.fields.length,mode:j.mode,t0:j.t[0],t1:j.t[j.t.length-1],cpu:+CARD.ENGINE.ms.toFixed(3),errs:CARD.ERRS.length,bad:CARD.nonFinite().length})})()';
const INFO = '"@"+CARD.MS.heardT.toFixed(4)+" "+CARD.REG[11].scene.hooks.info()';

const steps = [
  { until: 'window.CARD', timeout: 60000 },
  { until: 'window.CARD.ENGINE.AU.file && window.CARD.ENGINE.AU.file.open', timeout: 300000 },
  { eval: head },
  { until: 'window.__FRAME>=' + (fStart - 1), timeout: 900000 },
  { eval: START },
];
shots.forEach((T, i) => {
  steps.push({ until: 'window.__FRAME>=' + fOf(T), timeout: 900000 });
  steps.push({ eval: INFO });
  steps.push({ shot: tag + '-' + String(i).padStart(2, '0') });
});
steps.push({ until: 'window.__FRAME>=' + fEnd, timeout: 900000 });
steps.push({ eval: STOP });
for (let i = 0; i < MAX_CHUNKS; i++) steps.push({ eval: `window.__tj.slice(${i * CHUNK},${(i + 1) * CHUNK})` });

const env = Object.assign({}, process.env, { GPU: '1', CLOCK: '1', OUT: path.join(ROOT, 'tools/work') });
const ch = spawn('node', [path.join(ROOT, 'tools/cdp.js'), hash, JSON.stringify(steps)], { env, maxBuffer: 1 << 28 });
let buf = '';
ch.stdout.on('data', (d) => (buf += d));
ch.stderr.on('data', (d) => process.stderr.write(d));
ch.on('exit', (code) => {
  const lines = buf.split('\n');
  const evals = lines.filter((l) => l.startsWith('EVAL ')).map((l) => l.slice(l.indexOf('=> ') + 3));
  const errs = lines.filter((l) => l.startsWith('[EXC]') || l.startsWith('[console.error]') || l.startsWith('TIMEOUT') || l.startsWith('[EVAL-ERR]'));
  const un = (s) => { try { return JSON.parse(s); } catch (e) { return null; } };
  const dbl = (s) => un(un(s || 'null') || 'null');
  const H = dbl(evals[0]);
  const meta = dbl(evals[evals.length - MAX_CHUNKS - 1]);
  if (errs.length) console.log('page errors:', errs.slice(0, 4).join(' | '));
  if (!meta) { console.log('chwin: no trace came back (exit ' + code + ')'); console.log(lines.slice(-14).join('\n')); process.exit(1); }
  if (H && H.f0 !== F0) console.log(`chwin: WARNING frame0 is ${H.f0}, not ${F0}`);
  for (let i = 0; i < shots.length; i++) console.log('  shot ' + tag + '-' + String(i).padStart(2, '0') + ' ' + (un(evals[2 + i]) || ''));
  const json = evals.slice(evals.length - MAX_CHUNKS).map((s) => un(s) || '').join('');
  if (json.length !== meta.len) { console.log(`chwin: got ${json.length} of ${meta.len} characters — raise MAX_CHUNKS`); process.exit(1); }
  const out = path.join(ROOT, 'tools/work', tag + '.json');
  fs.writeFileSync(out, json);
  console.log(`${tag}: ${meta.frames} frames · ${meta.fields} fields · heard ${meta.t0} → ${meta.t1} · ${meta.mode} · f0 ${H ? H.f0 : '?'} · ERRS ${meta.errs} · nonFinite ${meta.bad} · ENGINE.ms ${meta.cpu} · ${(meta.len / 1048576).toFixed(2)} MB`);
  process.exit(errs.length ? 1 : 0);
});
