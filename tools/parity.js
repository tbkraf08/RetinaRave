// Parity between cardioid3.html (via FILE=, legacy cdp semantics) and Eigenwobble on the same #test timeline.
// usage: node tools/parity.js [fake|real|both]   (seed.looks — the director's look memory, absent in v3 — is ignored)   (env GPU=1 recommended; shots -> tools/accept/v0.2/)
//   fake: CLOCK=1 deterministic 60 Hz clock on both, MS + NAV dumped every 60 frames for 24 s, max |diff| per field
//         (expected 0: the fake path is deterministic), screenshots at frames 360/840/1200 (T≈6/14/20) montaged.
//   real: #test&fake=0 (demo synth, real audio, real clock) for 32 s: both bpm within 1 of the synth's 126 (v0.2 §9: the canonical
//         tempo no longer tracks v3's; v3's known error on this synth is +0.1..0.2), arc sequence identical, drop times within 0.5 s.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const V3 = process.env.V3 || '/home/toma/Documents/Kraftek/Cardioid/cardioid3.html';
const OUT = path.join(HERE, 'accept/v0.2');
const mode = process.argv[2] || 'both';

const SNAP = `(()=>{const S=CARD.MS,N=CARD.NAV||CARD.home,o={};for(const k in S){const v=S[k];if(typeof v==='number'||typeof v==='boolean'||typeof v==='string')o[k]=v;
else if(v&&v.length!==undefined)o[k]=Array.from(v,x=>Array.isArray(x)?x.slice():x);else if(v&&typeof v==='object')o[k]=Object.assign({},v);}
o['nav.c']=N.c.slice();o['nav.mode']=N.mode;o['nav.h']=N.h.x;o['nav.alpha']=N.alpha.x;o['nav.th']=N.th.x;o['nav.lg']=N.lg.x;o['nav.par']=N.par;o['nav.vtime']=N.vtime;o['nav.kick']=N.kick.x;o['nav.cyc.has']=N.cyc.has;
o['groove.rot']=CARD.GROOVE.rot;o['sc']=[CARD.SC.cur,CARD.SC.next,CARD.SC.m];o['q.scale']=CARD.Q.scale;o['q.iter']=CARD.Q.iter;return o;})()`;
const SAMPLER = `window.__SAMP=[];window.__last=-1;(function s(){if(window.__FRAME%60===0&&window.__FRAME!==window.__last){window.__last=window.__FRAME;window.__SAMP.push(Object.assign({frame:window.__FRAME},${SNAP}));}requestAnimationFrame(s);})();'ok'`;

function run(legacy, hash, steps, env = {}) {
  const e = Object.assign({}, process.env, { OUT }, env);
  if (legacy) e.FILE = V3;
  else delete e.FILE;
  const r = spawnSync('node', [path.join(HERE, 'cdp.js'), hash, JSON.stringify(steps)], { encoding: 'utf8', env: e, maxBuffer: 1 << 26, timeout: 400000 });
  const out = (r.stdout || '') + (r.stderr || '');
  const m = out.split('\n').filter((l) => l.startsWith('EVAL')).map((l) => JSON.parse(l.slice(l.indexOf('=> ') + 3)));
  const errs = out.split('\n').filter((l) => l.startsWith('[EXC]') || l.startsWith('[console.error]'));
  return { out, evals: m, errs };
}

function diffFields(A, B) {
  const keys = new Set([...Object.keys(A[0] || {}), ...Object.keys(B[0] || {})]);
  const res = {};
  for (const k of keys) {
    let mx = 0, missing = '';
    for (let i = 0; i < Math.min(A.length, B.length); i++) {
      const a = A[i][k], b = B[i][k];
      if (a === undefined) missing = 'missing in v3'; else if (b === undefined) missing = 'missing in ew';
      else if (typeof a === 'number' && typeof b === 'number') mx = Math.max(mx, Math.abs(a - b));
      else if (Array.isArray(a) && Array.isArray(b)) {
        const fa = a.flat(2), fb = b.flat(2);
        for (let j = 0; j < Math.max(fa.length, fb.length); j++) {
          const x = fa[j], y = fb[j];
          if (typeof x === 'number' && typeof y === 'number') mx = Math.max(mx, Math.abs(x - y)); else if (x !== y) mx = Math.max(mx, 1);
        }
      } else if (a && b && typeof a === 'object') { for (const kk of new Set([...Object.keys(a), ...Object.keys(b)])) if (kk !== 'looks' && a[kk] !== b[kk]) mx = Math.max(mx, typeof a[kk] === 'number' ? Math.abs(a[kk] - b[kk]) : 1); }
      else if (a !== b) mx = Math.max(mx, 1);
    }
    res[k] = missing || mx;
  }
  return res;
}

let status = 0;
if (mode === 'fake' || mode === 'both') {
  console.log('=== fake path (CLOCK=1, #test&scene=0, 24 s = 1440 frames) ===');
  const q = process.env.QOFF ? [{ until: 'window.CARD' }, { eval: 'CARD.SC.quantise=false' }] : []; // QOFF=1: §10 B off (director check only; the fake parity forces scene 0)
  const steps = [{ wait: 300 }, { eval: SAMPLER }, { until: 'window.__FRAME>=360' }, { shot: 'SIDE-t6' }, { until: 'window.__FRAME>=840' }, { shot: 'SIDE-t14' },
    { until: 'window.__FRAME>=1200' }, { shot: 'SIDE-t20' }, { until: 'window.__FRAME>=1441' }, { eval: 'JSON.stringify(window.__SAMP)' }, { eval: 'JSON.stringify(CARD.ERRS)' }, { eval: 'JSON.stringify(CARD.log.filter(l=>/@/.test(l)))' }];
  const sub = (side) => JSON.parse(JSON.stringify(steps).replace(/SIDE/g, side));
  const a = run(true, 'test&scene=0', sub('v3'), { CLOCK: '1' }), b = run(false, 'test&scene=0', q.concat(sub('ew')), { CLOCK: '1' });
  if (a.errs.length || b.errs.length) { console.log('page errors:', a.errs, b.errs); status = 1; }
  const o = q.length ? 1 : 0, A = JSON.parse(a.evals[1] || '[]'), B = JSON.parse(b.evals[1 + o] || '[]');
  console.log('samples v3', A.length, 'ew', B.length, '· ERRS v3', a.evals[2], 'ew', b.evals[2 + o]);
  const d = diffFields(A, B);
  const bad = Object.entries(d).filter(([k, v]) => typeof v === 'number' && v > 1e-9);
  const info = Object.entries(d).filter(([k, v]) => typeof v !== 'number');
  const nums = Object.entries(d).filter(([k, v]) => typeof v === 'number');
  if (info.length) console.log('info (fields on one side only — v3 creates some at runtime, level was deleted):', info.map(([k, v]) => k + ':' + v).join('  '));
  console.log('max |diff| over all numeric fields:', Math.max(0, ...nums.map(([, v]) => v)), '· fields compared', nums.length);
  if (bad.length) { console.log('MISMATCH:', bad.map(([k, v]) => k + '=' + v).join('  ')); status = 1; } else console.log('MS/NAV parity: every field identical to 1e-9');
  console.log('events v3:', a.evals[3]);
  console.log('events ew:', b.evals[3 + o]);
  const mt = spawnSync('python3', [path.join(HERE, 'montage.py'), path.join(OUT, 'parity-fake.jpg'), '3', ...['t6', 't14', 't20'].map((t) => path.join(OUT, 'v3-' + t + '.jpg')), ...['t6', 't14', 't20'].map((t) => path.join(OUT, 'ew-' + t + '.jpg'))], { encoding: 'utf8' });
  console.log('montage:', mt.status === 0 ? path.join(OUT, 'parity-fake.jpg') : mt.stderr);
}
if (mode === 'real' || mode === 'both') {
  console.log('=== real extractor (#test&fake=0, demo synth, 32 s) ===');
  const steps = [{ wait: 32000 }, { eval: 'JSON.stringify({bpm:CARD.MS.bpm,arcs:CARD.log.filter(l=>/^SECTION@/.test(l)).map(l=>l.split(" ")[1]),drops:CARD.log.filter(l=>/^DROP@/.test(l)).map(l=>+l.slice(5).split(" ")[0]),errs:CARD.ERRS,bad:(CARD.nonFinite||(()=>[]))()})' }];
  const a = run(true, 'test&fake=0&scene=0', steps), b = run(false, 'test&fake=0&scene=0', steps);
  const A = JSON.parse(a.evals[0] || '{}'), B = JSON.parse(b.evals[0] || '{}');
  console.log('v3:', JSON.stringify(A));
  console.log('ew:', JSON.stringify(B));
  const dedup = (x) => (x || []).filter((v, i, arr) => i === 0 || v !== arr[i - 1]);
  const TRUE_BPM = 126; // sources/demo.js
  const bpmOk = Math.abs(B.bpm - TRUE_BPM) <= 1 && Math.abs(A.bpm - TRUE_BPM) <= 1, arcOk = JSON.stringify(dedup(A.arcs)) === JSON.stringify(dedup(B.arcs));
  const dropOk = (A.drops || []).length === (B.drops || []).length && (A.drops || []).every((t, i) => Math.abs(t - B.drops[i]) <= 0.5);
  console.log('bpm within 1 of 126 (ew ' + (+B.bpm).toFixed(2) + ', v3 ' + (+A.bpm).toFixed(2) + '):', bpmOk, '· arc sequence identical:', arcOk, '· drops within 0.5 s:', dropOk, '· ew ERRS', JSON.stringify(B.errs), 'nonfinite', JSON.stringify(B.bad));
  if (!(bpmOk && arcOk && dropOk)) status = 1;
}
process.exit(status);
