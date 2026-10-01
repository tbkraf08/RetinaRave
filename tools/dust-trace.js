// Scene-side per-frame ruler for a scene on a real track (the DUST overhaul, DECISIONS §57).
//   node tools/dust-trace.js <track> <t0> <t1> <out.json> [sceneId=1] [msFields] [extraHash]
//   e.g. PORT=8880 node tools/dust-trace.js SeeYouDrop 32 62 tools/work/d/syd1-before.json
//
// tools/filetrace.js records MS only, and MS says nothing about what a SCENE did with it; tools/probe.js reads the
// canvas but needs a real window. This tool is the two of them on the deterministic file path: it forces the scene
// (`#test&track=<T>&at=<t0-WARM>&map=0&scene=<id>`, CLOCK=1 GPU=1 — the live path on a file, HARNESS "File source"),
// registers its own rAF AFTER the loop's (the CLOCK shim runs the queued callbacks in registration order, and
// core/loop.js re-registers at the top of its own callback, so ours always runs after the frame is drawn and
// composited) and records per frame:
//   t      MS.heardT
//   lum    mean luminance of the COMPOSITED default framebuffer (readPixels of a centred half-size window,
//          every 4th pixel — post-composite, so the vignette and the tonemap are in it, as the eye sees them)
//   lumC   the centre 20 % · lumR the 60-90 % rim annulus (the same split tools/lum.py uses on a shot)
//   lumM   the 25-55 % BODY annulus between them, where the snare's ring travels (added for §58 task A)
//   <ms>   the named MS fields (numbers and booleans)
//   <k>    every numeric key of the scene's `hooks.dinfo()` (a read-only hook; absent = no scene columns)
// Output is the same {track, mode, at, fps, fields, f, t, cols} shape tools/truth/*.py read, so dropcheck.py and
// friends grade it unchanged. Two runs of the same window are bit-identical (the four rules of a deterministic
// real-track run, HARNESS).
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WARM = process.env.WARM === undefined ? 8 : +process.env.WARM;
const FPS = 60;
const F0 = 2;
const CHUNK = 400000;
const MAX_CHUNKS = 40;

const [track, t0s, t1s, out, sceneArg, fieldsArg, extraHash] = process.argv.slice(2);
if (!track || t0s === undefined || t1s === undefined || !out) {
  console.error('usage: node tools/dust-trace.js <track> <t0> <t1> <out.json> [sceneId=1] [msFields] [extraHash]');
  process.exit(2);
}
const t0 = +t0s, t1 = +t1s, sid = sceneArg === undefined || sceneArg === '' ? 1 : +sceneArg;
const MS_DEFAULT = ['heardT', 'lvl', 'alive', 'eM', 'eS', 'bassS', 'midS', 'highS', 'kick', 'kick2', 'kickAge', 'kickEvt',
  'snare2', 'snareAge', 'snareEvt', 'snareAmp', 'kickAmp', 'hat2', 'hatAge', 'hatEvt', 'beat', 'beatPhase', 'beatCount', 'bpm', 'barPos',
  'barPhase', 'phrase16Pos', 'barNovelEvt', 'barReturnEvt', 'sectionAlt', 'sectionReturn', 'buildLive', 'dropLiveIn',
  'dropLiveEvt', 'dropEnv', 'dropEvt', 'tension', 'nextDropIn', 'nextBarIn', 'subGate', 'subNoteEvt', 'hush', 'denK', 'arc',
  'eMax', 'eG', 'mapOn', 'riser', 'roll', 'denH', 'presence', 'build'];
const msf = !fieldsArg || fieldsArg === '*' ? MS_DEFAULT : fieldsArg.split(',').map((s) => s.trim()).filter(Boolean);
const at = Math.max(0, t0 - WARM);
const hash = 'test&track=' + track + '&at=' + at + '&map=0&scene=' + sid + (extraHash || '');
const fOf = (T) => F0 + Math.round((T - at) * FPS);
const fStart = fOf(t0), fEnd = fOf(t1);

// The recorder, installed in the page. `W` is the readPixels window: a centred half of the drawing buffer, sampled
// every 4th pixel in x and y (a 160x90 grid at 1280x720) — the same picture lum.py measures, 40x cheaper.
const INSTALL = `(()=>{
  const C = window.__DT = { f: [], t: [], rows: [], keys: null, ms: ${JSON.stringify(msf)}, on: true, err: null };
  const gl = CARD.ctx.gl, cv = gl.canvas;
  const SX = 4, W = (cv.width >> 1) & ~3, H = (cv.height >> 1) & ~3, X = (cv.width - W) >> 1, Y = (cv.height - H) >> 1;
  const buf = new Uint8Array(W * H * 4);
  const sc = CARD.REG[${sid}] && CARD.REG[${sid}].scene;
  const info = sc && sc.hooks && sc.hooks.dinfo ? () => sc.hooks.dinfo() : null;
  function lum() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.readPixels(X, Y, W, H, gl.RGBA, gl.UNSIGNED_BYTE, buf);
    let s = 0, n = 0, sc2 = 0, nc = 0, sr = 0, nr = 0, sm = 0, nm = 0;
    const cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2;
    for (let y = 0; y < H; y += SX) for (let x = 0; x < W; x += SX) {
      const i = (y * W + x) * 4, v = (buf[i] + buf[i + 1] + buf[i + 2]) / 3;
      s += v; n++;
      const d = Math.hypot(x - cx, y - cy) / R;
      if (d < 0.2) { sc2 += v; nc++; } else if (d >= 0.6 && d <= 0.9) { sr += v; nr++; }
      if (d >= 0.25 && d < 0.55) { sm += v; nm++; }        /* the BODY, where the snare's ring travels (§58 task A) */
    }
    return [n ? s / n : 0, nc ? sc2 / nc : 0, nr ? sr / nr : 0, nm ? sm / nm : 0];
  }
  function tick() {
    if (!C.on) return;
    requestAnimationFrame(tick);
    try {
      const MS = CARD.MS, L = lum(), o = info ? info() : null;
      if (!C.keys) {
        C.keys = ['lum', 'lumC', 'lumR', 'lumM'].concat(C.ms);
        if (o) for (const k in o) if (typeof o[k] === 'number' || typeof o[k] === 'boolean') C.keys.push('d_' + k);
      }
      const r = [L[0], L[1], L[2], L[3]];
      for (const k of C.ms) { const v = MS[k]; r.push(typeof v === 'boolean' ? (v ? 1 : 0) : typeof v === 'number' ? (Number.isFinite(v) ? v : null) : typeof v === 'string' ? v : null); }
      if (o) for (const k of C.keys) { if (k.slice(0, 2) !== 'd_') continue; const v = o[k.slice(2)]; r.push(typeof v === 'boolean' ? (v ? 1 : 0) : Number.isFinite(v) ? v : null); }
      C.f.push(CARD.ENGINE.frameN); C.t.push(CARD.MS.heardT); C.rows.push(r);
    } catch (e) { C.err = String(e); C.on = false; }
  }
  requestAnimationFrame(tick);
  return JSON.stringify({ w: W, h: H, scene: ${sid}, info: !!info });
})()`;

const STOP = `(()=>{
  const C = window.__DT; C.on = false;
  const cols = {};
  for (let i = 0; i < C.keys.length; i++) cols[C.keys[i]] = C.rows.map((r) => (r[i] === undefined ? null : (typeof r[i] === 'number' ? +r[i].toFixed(6) : r[i])));
  for (let i = 0; i < C.keys.length; i++) { const a = cols[C.keys[i]]; for (let j = 0; j < a.length; j++) if (a[j] !== null && typeof a[j] !== 'number' && typeof a[j] !== 'string') a[j] = null; }
  const j = { track: ${JSON.stringify(track)}, mode: 'file-det', sr: CARD.ENGINE.AU.file.sr, at: ${at}, fps: 60,
    detLead: 0, scene: ${sid}, fields: C.keys, f: C.f, t: C.t.map((x) => +x.toFixed(6)), cols, log: [] };
  window.__tj = JSON.stringify(j);
  return JSON.stringify({ len: window.__tj.length, frames: C.f.length, fields: C.keys.length, err: C.err, t0: C.t[0], t1: C.t[C.t.length - 1], errs: CARD.ERRS.length });
})()`;

// cdp.js logs `EVAL <expr.slice(0,60)> => <value>` on one line, so a newline inside the first 60 characters of an
// expression splits the log line and the driver can no longer find the value: both blocks go over as one line.
const flat = (s) => s.replace(/\s*\n\s*/g, ' ');

const steps = [
  { until: 'window.CARD', timeout: 60000 },
  { until: 'window.CARD.ENGINE.AU.file && window.CARD.ENGINE.AU.file.open', timeout: 300000 },
  { until: 'window.__FRAME>=' + (fStart - 1), timeout: 900000 },
  { eval: flat(INSTALL) },
  { until: 'window.__FRAME>=' + fEnd, timeout: 900000 },
  { eval: flat(STOP) },
  ...Array.from({ length: MAX_CHUNKS }, (_, i) => ({ eval: `window.__tj.slice(${i * CHUNK},${(i + 1) * CHUNK})` })),
];

const env = Object.assign({}, process.env, { GPU: '1', CLOCK: '1', OUT: path.join(HERE, 'work') });
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
  const meta = dbl(evals[evals.length - MAX_CHUNKS - 1]);
  if (errs.length) console.log('page errors:', errs.slice(0, 4).join(' | '));
  if (!meta) { console.log('dust-trace: no trace came back (exit ' + code + ')'); console.log(lines.slice(-12).join('\n')); process.exit(1); }
  const json = evals.slice(evals.length - MAX_CHUNKS).map((s) => un(s) || '').join('');
  if (json.length !== meta.len) { console.log(`dust-trace: got ${json.length} of ${meta.len} characters — raise MAX_CHUNKS`); process.exit(1); }
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  fs.writeFileSync(out, json);
  console.log(`${out}: ${meta.frames} frames · ${meta.fields} cols · heard ${meta.t0} → ${meta.t1} · scene ${sid} · recorder err ${meta.err} · CARD.ERRS ${meta.errs}`);
  process.exit(errs.length || meta.err ? 1 : 0);
});
