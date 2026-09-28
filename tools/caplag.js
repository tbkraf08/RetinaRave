// Measure the CAPTURE path's lag (SYNC_OFS) and record a capture-mode trace graded in the listener's own time.
//   node tools/caplag.js clicks [dur=20]                     -> SYNC_OFS from a click train (tools/work/caplag/clicks.json)
//   node tools/caplag.js track <name> <at> <dur> [sync_ms]   -> tools/work/caplag/<name>-cap.json, a trace whose `t` is the
//                                                              TRACK second the listener hears at each frame
// Headed and AUDIBLE (the source plays through the speakers): HEADED=1, CAPTITLE=RR-SRC, the page on monitor 0, the
// source (tools/capsrc.html) in its own window on monitor 1 (HARNESS "Real window": the music must be in its own window).
//
// Clocks. The source maps its context time to the wall (performance.timeOrigin + getOutputTimestamp().performanceTime):
// the wall time at which a sample it plays is HEARD. The page maps AU.ctx.currentTime to the wall per rAF, and stamps each
// captured click with the audio time of its first sample over 0.15 (the PCM bus is sample-exact; a 0.25 s refractory,
// not a quiet gate: the capture path filters the click, so its edge RISES through any low gate before it is loud). Then
//   SYNC_OFS = t_captured − currentTime(at the wall time the click was heard)
// which is exactly what AU.heardT() = currentTime + SYNC_OFS needs to make heardT the audio time of what is heard. Not
// included: the frame's own path to the glass (compositor + display, ~1–3 frames), which no clock here can see.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUTD = path.join(HERE, 'work', 'caplag');
const CHUNK = 400000, MAX_CHUNKS = 30;
const [mode = 'clicks', ...rest] = process.argv.slice(2);
const PORT = process.env.PORT || '8830';
const FIELDS = ['heardT', 'beat', 'beatPhase', 'bpm', 'regularity', 'beatConf', 'gridTrust', 'barConf', 'barPos', 'barPhase',
  'phrasePos', 'phrase16Pos', 'beatSyn', 'bpmSyn', 'dropEvt', 'dropConf', 'dropExpectedIn', 'build', 'boundaryEvt',
  'kickEvt', 'kickAge', 'snareEvt', 'snareAge', 'hatEvt', 'hatAge', 'subHz', 'subGlide', 'onset', 'kick', 'snare', 'hat'];

let src, dur, track = '', at = 0, sync = 0;
if (mode === 'clicks') { dur = +(rest[0] || 20); src = `mode=clicks&dur=${dur}`; }
else if (mode === 'track') { [track, at, dur] = [rest[0], +rest[1], +rest[2]]; sync = +(rest[3] || 0); src = `mode=track&track=${encodeURIComponent(track)}&at=${at}&dur=${dur}`; }
else { console.error('usage: node tools/caplag.js clicks [dur] | track <name> <at> <dur> [sync_ms]'); process.exit(2); }

const PROBE = `(()=>{window.__CL={map:[],clicks:[],last:-9};const E=CARD.ENGINE,A=E.AU;
(function loop(){const c=A.ctx;if(c)__CL.map.push([c.currentTime,performance.timeOrigin+performance.now(),CARD.MS.heardT]);requestAnimationFrame(loop)})();
E.PCM.on((L,R,t0)=>{const sr=A.ctx.sampleRate;for(let i=0;i<L.length;i++){const t=t0+i/sr;
if(Math.abs(L[i])>0.15&&t-__CL.last>0.25){__CL.clicks.push(t);__CL.last=t}}});
return {mode:A.mode,sr:A.ctx.sampleRate,outLat:A.ctx.outputLatency,baseLat:A.ctx.baseLatency,sync:A.sync}})()`;
const steps = [
  { until: 'window.CARD', timeout: 60000 },
  { tab: `http://127.0.0.1:${PORT}/tools/capsrc.html?${src}`, window: { left: 2760, top: 120, width: 520, height: 260 } },
  { wait: 1500 },
  { evalTab: 'SRC.load()' },
  { activate: 'main' },
  { clickSel: '#go' },
  { until: "CARD.ENGINE.AU.mode==='capture'", timeout: 20000 },
  { eval: PROBE },
  ...(mode === 'track' ? [{ eval: `CARD.TRACE.start(${JSON.stringify(FIELDS)}),1` }] : []),
  { evalTab: 'SRC.start()' },
  { wait: (dur + 2) * 1000 },
  { eval: mode === 'track' ? '(()=>{const j=CARD.TRACE.stop();window.__tj=JSON.stringify(j);return window.__tj.length})()' : '0' },
  { evalTab: 'SRC.dump()' },
  { eval: 'JSON.stringify({map:__CL.map,clicks:__CL.clicks,sync:CARD.ENGINE.AU.sync,diag:{heard:CARD.ENGINE.AU.heard,demo:!!CARD.ENGINE.AU.demo,mode:CARD.ENGINE.AU.mode}})' },
  ...(mode === 'track' ? Array.from({ length: MAX_CHUNKS }, (_, i) => ({ eval: `window.__tj.slice(${i * CHUNK},${(i + 1) * CHUNK})` })) : []),
];
const hash = 'real' + (sync ? '&sync=' + sync : '');
const env = Object.assign({}, process.env, { HEADED: '1', CAPTITLE: 'RR-SRC', PORT, WIN: process.env.WIN || '1600,900', WINPOS: process.env.WINPOS || '100,100' });
delete env.CLOCK;
const ch = spawn('node', [path.join(HERE, 'cdp.js'), hash, JSON.stringify(steps)], { env, maxBuffer: 1 << 28 });
let buf = '';
ch.stdout.on('data', (d) => (buf += d));
ch.stderr.on('data', (d) => process.stderr.write(d));

// least squares y = a + b x
const fit = (xs, ys) => {
  const n = xs.length, mx = xs.reduce((s, v) => s + v, 0) / n, my = ys.reduce((s, v) => s + v, 0) / n;
  let sxy = 0, sxx = 0; for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; }
  const b = sxy / sxx, a = my - b * mx;
  const res = xs.map((x, i) => ys[i] - (a + b * x)); const rms = Math.sqrt(res.reduce((s, v) => s + v * v, 0) / n);
  return { a, b, rms, f: (x) => a + b * x, inv: (y) => (y - a) / b };
};
const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.max(0, Math.round(p * (s.length - 1))))]; };

ch.on('exit', (code) => {
  const lines = buf.split('\n');
  const un = (s) => { try { return JSON.parse(s); } catch (e) { return null; } };
  const ev = lines.filter((l) => l.startsWith('EVAL ')).map((l) => l.slice(l.indexOf('=> ') + 3));
  const et = lines.filter((l) => l.startsWith('EVALTAB ')).map((l) => l.slice(l.indexOf('=> ') + 3));
  const errs = lines.filter((l) => /^\[EXC\]|^\[EVAL-ERR\]|^TIMEOUT|^\[console.error\]/.test(l));
  if (errs.length) console.log('page errors:', errs.slice(0, 5).join(' | '));
  const probe = un(ev[0]);
  const S = un(un(et[et.length - 1]) || 'null');
  const P = un(un(ev[mode === 'track' ? 3 : 2]) || 'null');             // EVAL order: probe, (trace start), stop, map, chunks
  if (!S || !P) { console.log('caplag: no data back (exit ' + code + ')'); console.log(lines.slice(-25).join('\n')); process.exit(1); }
  console.log('page', JSON.stringify(probe), '· source outLat', S.outLat, 'baseLat', S.baseLat, 'sr', S.sr);
  const fs_ = fit(S.map.map((m) => m[0]), S.map.map((m) => m[1]));               // source ctx time -> wall ms (heard)
  // the page: keep the first rAF that sees each new currentTime value (the least-stale pairing), fit ct -> wall ms
  const pm = P.map.filter((m, i, a) => i === 0 || m[0] !== a[i - 1][0]);
  const fp = fit(pm.map((m) => m[0]), pm.map((m) => m[1]));
  console.log(`fits: source ctx->wall rms ${fs_.rms.toFixed(2)} ms (n ${S.map.length}, rate ${fs_.b.toFixed(3)}) · page currentTime->wall rms ${fp.rms.toFixed(2)} ms (n ${pm.length}, rate ${fp.b.toFixed(3)})`);
  fs.mkdirSync(OUTD, { recursive: true });
  if (mode === 'clicks') {
    const heard = S.clicks.map((tc) => fs_.f(tc));                            // wall ms each click was heard
    const cap = P.clicks;                                                     // page audio time each click arrived
    const lag = [];
    for (const tcap of cap) {
      const w = fp.f(tcap);                                                   // wall ms when the page's currentTime = tcap
      let best = null; for (const h of heard) if (best === null || Math.abs(w - h) < Math.abs(w - best)) best = h;
      if (best !== null && Math.abs(w - best) < 250) lag.push(w - best);
    }
    console.log("diag", JSON.stringify(P.diag), "captured", JSON.stringify(P.clicks.slice(0, 5)));
    if (!lag.length) { console.log("no click matched"); process.exit(1); }
    const out = { clicks: S.clicks.length, captured: cap.length, matched: lag.length, lagMs: lag,
      median: q(lag, 0.5), p10: q(lag, 0.1), p90: q(lag, 0.9), srcOutLat: S.outLat, pageOutLat: probe && probe.outLat };
    fs.writeFileSync(path.join(OUTD, 'clicks.json'), JSON.stringify(out, null, 1));
    console.log('diag', JSON.stringify(P.diag));
    console.log(`clicks: ${S.clicks.length} played, ${cap.length} captured, ${lag.length} matched`);
    console.log(`CAPTURE LAG (SYNC_OFS): median ${out.median.toFixed(1)} ms · p10 ${out.p10.toFixed(1)} · p90 ${out.p90.toFixed(1)} → &sync=${Math.round(out.median)}`);
  } else {
    const json = ev.slice(ev.length - MAX_CHUNKS).map((s) => un(s) || '').join('');
    const tr = un(json);
    if (!tr) { console.log('caplag: trace did not parse (' + json.length + ' chars)'); process.exit(1); }
    const sy = (P.sync || 0);
    // each frame: heardT -> the page's currentTime -> wall -> the source's context time -> the track second heard
    tr.tHeardCtx = tr.t;
    tr.t = tr.t.map((t) => { const w = fp.f(t - sy); return +(at + (fs_.inv(w) - S.s0)).toFixed(6); });
    tr.track = track; tr.mode = 'capture'; tr.capture = { sync: sy, at, dur, srcFitRms: fs_.rms, pageFitRms: fp.rms };
    const f = path.join(OUTD, `${track}-cap${sy ? '-sync' + Math.round(sy * 1000) : ''}.json`);
    fs.writeFileSync(f, JSON.stringify(tr));
    console.log(`${f}: ${tr.t.length} frames, listener time ${tr.t[0].toFixed(2)} → ${tr.t[tr.t.length - 1].toFixed(2)} s, sync ${sy}`);
  }
  process.exit(errs.length ? 1 : 0);
});
