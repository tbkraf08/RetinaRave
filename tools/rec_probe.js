// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// Measure a take without ffmpeg (DECISIONS §92). Two halves: (1) node walks the webm's EBML — the video track's codec and
// pixel size, the block count (= encoded frames), the duration (last cluster + block timecode; a MediaRecorder webm has no
// Duration header), bytes per second of video overall and per second of the take; (2) headless Chrome plays it in a <video>
// (same origin: tools/serve.js serves tools/work/rec/), requestVideoFrameCallback hands every presented frame, and every
// STEP s a frame goes through LAPVAR: the decoded size, the mean luma, the Laplacian variance at 1× (lap) and on the 2× / 4× / 8×
// box-downsampled frame (l2 l4 l8); r14 = lap/l4 and r18 = lap/l8 are the sharpness measures that survive a change of content:
// an upscaled soft render (or a starved encoder) has little energy at 1 px against what it has at 4–8 px → low.
// LAPVAR is exported so tools/cdp.js evals can score a live WebGL frame the same way (the comparison shot).
// usage: [GPU=1] [PORT=8951] [STEP=0.5] [SKIP=1] node tools/rec_probe.js <take.webm> [--json]   (SKIP=1 skips the browser half)
//        [GPU=1] [PORT=8951] [WIN=1920,1080] [N=10] node tools/rec_probe.js --take '<hash>' [--json]
//   --take: the app page at #test&fake=0&<hash> (the demo synth), a live frame scored before the take (the WebGL canvas read on
//   the rAF after the loop's, the same task), then __REC.start() for N s with a 1 s trace of Q.q / Q.scale / the compositor's
//   frames / CARD.frameN, __REC.stop(), the webm from REC.last.blob walked (EBML) and played (LAPVAR) in the same page, and a
//   live frame scored again after. One line per second, one summary line. The dev server on 8765 is never used: PORT=8951+.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '..');
const PORT = +(process.env.PORT || 8951), STEP = +(process.env.STEP || 0.5), FRAME = process.env.FRAME ? +process.env.FRAME : -1, PIN = process.env.PIN ? +process.env.PIN : null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const gpu = process.env.GPU ? ['--use-angle=gl', '--ignore-gpu-blocklist'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];

// In-page: score the RGBA of a canvas 2D context (w × h). Luma → Laplacian variance over the interior; the same on a 2× box-downsampled luma.
export const LAPVAR = `(function(ctx,w,h){const d=ctx.getImageData(0,0,w,h).data,n=w*h;let Y=new Float32Array(n),m=0;
for(let i=0,j=0;i<n;i++,j+=4){const y=0.299*d[j]+0.587*d[j+1]+0.114*d[j+2];Y[i]=y;m+=y;}m/=n;
const lv=(Y,w,h)=>{let s=0,s2=0,c=0;for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x,l=4*Y[i]-Y[i-1]-Y[i+1]-Y[i-w]-Y[i+w];s+=l;s2+=l*l;c++;}const mu=s/c;return s2/c-mu*mu;};
const down=(Y,w,h)=>{const w2=w>>1,h2=h>>1,Z=new Float32Array(w2*h2);for(let y=0;y<h2;y++)for(let x=0;x<w2;x++){const i=2*y*w+2*x;Z[y*w2+x]=(Y[i]+Y[i+1]+Y[i+w]+Y[i+w+1])/4;}return [Z,w2,h2];};
const l1=lv(Y,w,h),[Y2,w2,h2]=down(Y,w,h),l2=lv(Y2,w2,h2),[Y4,w4,h4]=down(Y2,w2,h2),l4=lv(Y4,w4,h4),[Y8,w8,h8]=down(Y4,w4,h4),l8=lv(Y8,w8,h8);
return {lum:+m.toFixed(2),lap:+l1.toFixed(2),l2:+l2.toFixed(1),l4:+l4.toFixed(1),l8:+l8.toFixed(1),r14:+(l1/Math.max(1e-6,l4)).toFixed(3),r18:+(l1/Math.max(1e-6,l8)).toFixed(3)};})`;

// --- EBML ---
function vint(b, i, keepMarker) {
  const first = b[i];
  let len = 1, mask = 0x80;
  while (len <= 8 && !(first & mask)) { len++; mask >>= 1; }
  let v = keepMarker ? first : first & (mask - 1), unknown = (first & (mask - 1)) === mask - 1;
  for (let k = 1; k < len; k++) { v = v * 256 + b[i + k]; if (b[i + k] !== 0xff) unknown = false; }
  return { v, len, unknown: unknown && !keepMarker };
}
const CONTAINERS = new Set([0x18538067, 0x1f43b675, 0x1549a966, 0xa0, 0x1654ae6b, 0xae, 0xe0, 0x1254c367, 0x7373, 0x67c8]); // Segment, Cluster, Info, BlockGroup, Tracks, TrackEntry, Video, Tags, Tag, SimpleTag
const uint = (b, i, end) => { let t = 0; for (let k = i; k < end; k++) t = t * 256 + b[k]; return t; };
export function walk(buf) {
  let i = 0, tcScale = 1e6, clusterTc = 0, last = 0, clusters = 0, cur = null;
  const tracks = {}, perSec = [];
  let tagName = '', sidecar = null;
  while (i < buf.length - 2) {
    const id = vint(buf, i, true); i += id.len;
    const sz = vint(buf, i, false); i += sz.len;
    if (id.v === 0xae) cur = { n: 0, type: 0, codec: '', w: 0, h: 0, blocks: 0, bytes: 0, key: 0 };
    if (CONTAINERS.has(id.v)) continue;
    const end = sz.unknown ? buf.length : i + sz.v;
    if (id.v === 0x2ad7b1) tcScale = uint(buf, i, end);
    else if (id.v === 0xe7) { clusterTc = uint(buf, i, end); clusters++; }
    else if (cur && id.v === 0xd7) { cur.n = uint(buf, i, end); tracks[cur.n] = cur; }
    else if (cur && id.v === 0x83) cur.type = uint(buf, i, end);
    else if (cur && id.v === 0x86) cur.codec = buf.toString('latin1', i, end);
    else if (cur && id.v === 0xb0) cur.w = uint(buf, i, end);
    else if (cur && id.v === 0xba) cur.h = uint(buf, i, end);
    else if (id.v === 0x45a3) tagName = buf.toString('utf8', i, end);
    else if (id.v === 0x4487 && tagName === 'COMMENT') { try { const o = JSON.parse(buf.toString('utf8', i, end)); if (o && o.app === 'retinarave') sidecar = o; } catch (e) {} }
    else if (id.v === 0xa3 || id.v === 0xa1) {
      const tr = vint(buf, i, false), rel = buf.readInt16BE(i + tr.len), t = clusterTc + rel, tk = tracks[tr.v];
      last = Math.max(last, t);
      if (tk) { tk.blocks++; tk.bytes += end - i; if (id.v === 0xa3 && buf[i + tr.len + 2] & 0x80) tk.key++; if (tk.type === 1) { const s = Math.floor(t * tcScale / 1e9); perSec[s] = (perSec[s] || 0) + end - i; } }
    }
    i = end;
  }
  return { s: last * tcScale / 1e9, clusters, tracks: Object.values(tracks), perSec, sidecar }; // sidecar: the one R embeds (§92), or null
}

export function ebmlReport(file) {
  const buf = fs.readFileSync(file), r = walk(buf), v = r.tracks.find((t) => t.type === 1), a = r.tracks.find((t) => t.type === 2);
  const o = { file: path.basename(file), bytes: buf.length, durationS: +r.s.toFixed(3), clusters: r.clusters, mbps: +(buf.length * 8 / r.s / 1e6).toFixed(2) };
  if (v) Object.assign(o, { codec: v.codec, size: [v.w, v.h], frames: v.blocks, fps: +(v.blocks / r.s).toFixed(2), keyframes: v.key, videoMbps: +(v.bytes * 8 / r.s / 1e6).toFixed(2), perSecMbps: r.perSec.map((b) => +(b * 8 / 1e6).toFixed(1)) });
  if (a) Object.assign(o, { audio: a.codec, audioBlocks: a.blocks, audioKbps: +(a.bytes * 8 / r.s / 1e3).toFixed(0) });
  o.sidecar = r.sidecar;
  return o;
}

// The browser half: play it, score a frame every STEP s. Returns [{ t, lum, lap, lap2, ratio }], the decoded size, playback quality.
const PLAY = (src, step, frameT = -1) => `(async()=>{const FT=${frameT};let jpg=null;const v=document.createElement('video');v.muted=true;v.src=${JSON.stringify(src)};document.body.appendChild(v);
await new Promise((r,j)=>{v.onloadedmetadata=r;v.onerror=()=>j(new Error('video error'));});
const c=document.createElement('canvas'),x=c.getContext('2d',{willReadFrequently:true});const rows=[];let next=0;
const score=${LAPVAR};
await new Promise((res)=>{const cb=(now,md)=>{if(md.mediaTime>=next){next=md.mediaTime+${step}-1e-3;c.width=v.videoWidth;c.height=v.videoHeight;x.drawImage(v,0,0);const s=score(x,c.width,c.height);s.t=+md.mediaTime.toFixed(3);s.pf=md.presentedFrames;rows.push(s);if(FT>=0&&!jpg&&md.mediaTime>=FT)jpg=c.toDataURL('image/jpeg',0.92);}v.requestVideoFrameCallback(cb);};v.requestVideoFrameCallback(cb);v.onended=res;v.play();});
const q=v.getVideoPlaybackQuality();return {size:[v.videoWidth,v.videoHeight],decoded:q.totalVideoFrames,dropped:q.droppedVideoFrames,rows,jpg};})()`;

async function ensureServer() {
  try { await fetch('http://127.0.0.1:' + PORT + '/'); return null; } catch (e) {}
  const sv = spawn('node', [path.join(HERE, 'serve.js'), String(PORT)], { stdio: 'ignore' });
  for (let i = 0; i < 40; i++) { await sleep(100); try { await fetch('http://127.0.0.1:' + PORT + '/'); return sv; } catch (e) {} }
  throw new Error('serve.js did not start');
}

function saveFrame(p, to) {
  if (p && p.jpg) { fs.writeFileSync(to, Buffer.from(p.jpg.split(',')[1], 'base64')); p.frame = to; }
  delete p.jpg;
  return p;
}

export async function browserReport(file) {
  const DL = path.join(ROOT, 'tools/work/rec');
  fs.mkdirSync(DL, { recursive: true });
  const local = 'probe-' + process.pid + '.webm';
  fs.copyFileSync(file, path.join(DL, local));
  const sv = await ensureServer();
  const dbg = 9300 + Math.floor(Math.random() * 500), udd = path.join(HERE, 'chr' + dbg);
  const ch = spawn('google-chrome', ['--headless=new', '--window-size=1280,720', ...gpu, '--remote-debugging-port=' + dbg, '--autoplay-policy=no-user-gesture-required', '--no-first-run', '--user-data-dir=' + udd, 'about:blank'], { stdio: 'ignore' });
  try {
    let tgt;
    for (let i = 0; i < 40 && !tgt; i++) { await sleep(250); try { const l = await (await fetch('http://127.0.0.1:' + dbg + '/json')).json(); tgt = l.find((t) => t.type === 'page'); } catch (e) {} }
    const ws = new WebSocket(tgt.webSocketDebuggerUrl);
    let id = 0; const pend = {};
    ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend[d.id]) { pend[d.id](d.result || d.error); delete pend[d.id]; } };
    await new Promise((r) => (ws.onopen = r));
    const send = (method, params = {}) => new Promise((r) => { pend[++id] = r; ws.send(JSON.stringify({ id, method, params })); });
    await send('Page.enable');
    await send('Page.navigate', { url: 'http://127.0.0.1:' + PORT + '/LICENSE' });
    await sleep(800);
    const r = await send('Runtime.evaluate', { expression: PLAY('/tools/work/rec/' + local, STEP, FRAME), returnByValue: true, awaitPromise: true, timeout: 600000 });
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 400));
    return saveFrame(r.result.value, path.join(DL, path.basename(file, '.webm') + '-frame.jpg'));
  } finally { try { ch.kill(); } catch (e) {} if (sv) sv.kill(); await sleep(300); fs.rmSync(udd, { recursive: true, force: true }); fs.rmSync(path.join(DL, local), { force: true }); }
}


// In-page: score the live WebGL canvas on the rAF after the loop's (same task: the drawing buffer is still there, CONTRACTS §1.19).
export const SCORE_GL = `new Promise((r)=>requestAnimationFrame(()=>{const g=document.getElementById('gl'),c=document.createElement('canvas');c.width=g.width;c.height=g.height;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(g,0,0);r(Object.assign(${LAPVAR}(x,c.width,c.height),{w:g.width,h:g.height,q:+CARD.Q.q.toFixed(3),scale:CARD.Q.scale,fps:+CARD.Q.fps.toFixed(1)}))}))`;

export async function takeReport(hash, N) {
  const DL = path.join(ROOT, 'tools/work/rec');
  fs.mkdirSync(DL, { recursive: true });
  const sv = await ensureServer();
  const dbg = 9300 + Math.floor(Math.random() * 500), udd = path.join(HERE, 'chr' + dbg), WIN = process.env.WIN || '1920,1080';
  const ch = spawn('google-chrome', ['--headless=new', '--window-size=' + WIN, ...gpu, '--remote-debugging-port=' + dbg, '--autoplay-policy=no-user-gesture-required', '--no-first-run', '--user-data-dir=' + udd, 'about:blank'], { stdio: 'ignore' });
  try {
    let tgt;
    for (let i = 0; i < 40 && !tgt; i++) { await sleep(250); try { const l = await (await fetch('http://127.0.0.1:' + dbg + '/json')).json(); tgt = l.find((t) => t.type === 'page'); } catch (e) {} }
    const ws = new WebSocket(tgt.webSocketDebuggerUrl);
    let id = 0; const pend = {}, errs = [];
    ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend[d.id]) { pend[d.id](d.result || d.error); delete pend[d.id]; } else if (d.method === 'Runtime.exceptionThrown') errs.push(JSON.stringify(d.params.exceptionDetails).slice(0, 300)); };
    await new Promise((r) => (ws.onopen = r));
    const send = (method, params = {}) => new Promise((r) => { pend[++id] = r; ws.send(JSON.stringify({ id, method, params })); });
    const ev = async (expression) => { const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, timeout: 600000 }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 400)); return r.result ? r.result.value : undefined; };
    await send('Runtime.enable');
    await send('Page.enable');
    await send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: DL, eventsEnabled: false });
    await send('Page.navigate', { url: 'http://127.0.0.1:' + PORT + '/#test&fake=0&' + hash });
    for (let i = 0; i < 100 && !(await ev('!!(window.CARD && window.__REC)')); i++) await sleep(100);
    if (PIN !== null) await ev(`window.__PINi=setInterval(()=>{CARD.Q.q=${PIN};CARD.Q.ceil=${PIN}},100);1`); // the control: the tier held by hand, the governor overruled every 100 ms
    await sleep(4000); // the governor's first windows settle
    const before = await ev(SCORE_GL);
    await ev(`window.__TR=[];window.__TR0={f:CARD.frameN,t:performance.now()};window.__TRi=setInterval(()=>{const R=__REC.REC;__TR.push({q:+CARD.Q.q.toFixed(3),scale:CARD.Q.scale,iter:CARD.Q.iter,fps:+CARD.Q.fps.toFixed(1),frameN:CARD.frameN,rec:R.frames===undefined?null:R.frames,w:document.getElementById('gl').width,h:document.getElementById('gl').height})},1000);__REC.start()`);
    await sleep(N * 1000);
    await ev('clearInterval(__TRi);__REC.stop();1');
    await sleep(1500);
    const after = await ev(SCORE_GL);
    const tr = await ev('__TR'), last = await ev('(()=>{const L=__REC.REC.last;return {name:L.name,bytes:L.bytes,mime:L.mime,sidecar:L.sidecar}})()');
    const bufB64 = await ev(`(async()=>{const b=await __REC.REC.last.blob.arrayBuffer();let s='';const u=new Uint8Array(b);for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode.apply(null,u.subarray(i,i+32768));return btoa(s)})()`);
    const buf = Buffer.from(bufB64, 'base64'), w = walk(buf), v = w.tracks.find((t) => t.type === 1);
    const play = saveFrame(await ev(PLAY('__BLOB__', STEP, FRAME).replace(JSON.stringify('__BLOB__'), 'URL.createObjectURL(__REC.REC.last.blob)')), path.join(DL, 'take-' + (process.env.TAG || hash.replace(/[^a-z0-9]+/gi, '_')) + '-frame.jpg'));
    return { hash, N, win: WIN, before, after, trace: tr, last, errs, ebml: { bytes: buf.length, durationS: +w.s.toFixed(3), clusters: w.clusters, codec: v && v.codec, size: v && [v.w, v.h], frames: v && v.blocks, fps: v && +(v.blocks / w.s).toFixed(2), mbps: +(buf.length * 8 / w.s / 1e6).toFixed(2), perSecMbps: w.perSec.map((b) => +(b * 8 / 1e6).toFixed(1)) }, play };
  } finally { try { ch.kill(); } catch (e) {} if (sv) sv.kill(); await sleep(300); fs.rmSync(udd, { recursive: true, force: true }); }
}

export function printTake(r) {
  const e = r.ebml, p = r.play, medOf = (k) => p.rows.map((x) => x[k]).sort((a, b) => a - b)[p.rows.length >> 1], laps = p.rows.map((x) => x.lap).sort((a, b) => a - b), med = medOf('lap'), r14 = medOf('r14'), r18 = medOf('r18');
  const f0 = r.trace[0], f1 = r.trace[r.trace.length - 1], secs = r.trace.length - 1, sc = r.last.sidecar;
  console.log(`take ${r.hash} · ${r.N} s · window ${r.win} · canvas ${f0.w}x${f0.h} · ${e.codec} ${e.size[0]}x${e.size[1]} · ${e.bytes} bytes · ${e.durationS} s · ${e.frames} frames = ${e.fps} fps encoded · ${e.mbps} Mb/s · presented ${p.decoded} dropped ${p.dropped}`);
  console.log(`  loop fps during the take ${secs > 0 ? ((f1.frameN - f0.frameN) / secs).toFixed(1) : '-'} · compositor fps ${(sc.frames / sc.durationS).toFixed(1)} · Q.q trace ${r.trace.map((t) => t.q.toFixed(2)).join(' ')} · scale ${r.trace.map((t) => t.scale).join(' ')}`);
  console.log(`  live frame before: q ${r.before.q} scale ${r.before.scale} lap ${r.before.lap} r14 ${r.before.r14} r18 ${r.before.r18} · after: q ${r.after.q} scale ${r.after.scale} lap ${r.after.lap} r14 ${r.after.r14} r18 ${r.after.r18}`);
  console.log(`  webm frames: lap median ${med} (min ${laps[0]} max ${laps[laps.length - 1]}) r14 median ${r14} r18 median ${r18}${p.frame ? ' · frame ' + path.relative(ROOT, p.frame) : ''} · per-second Mb/s ${e.perSecMbps.join(' ')} · sidecar ${JSON.stringify({ size: r.last.sidecar.size, fps: r.last.sidecar.fps, frames: r.last.sidecar.frames, mime: r.last.sidecar.mime, bps: r.last.sidecar.bps, q: r.last.sidecar.q, q0: r.last.sidecar.q0 })} · errs ${r.errs.length}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  (async () => {
    const file = process.argv[2];
    if (file === '--take') { const r = await takeReport(process.argv[3] || 'scene=0', +(process.env.N || 10)); fs.writeFileSync(path.join(ROOT, 'tools/work/rec', 'take-' + (process.env.TAG || 'last') + '.json'), JSON.stringify(r)); if (process.argv.includes('--json')) console.log(JSON.stringify(r)); else printTake(r); return; }
    if (!file) { console.log('usage: node tools/rec_probe.js <take.webm> | --take <hash>'); process.exit(2); }
    const e = ebmlReport(file);
    const out = { ebml: e };
    if (!process.env.SKIP) out.play = await browserReport(file);
    if (process.argv.includes('--json')) { console.log(JSON.stringify(out)); return; }
    console.log(`${e.file}: ${e.bytes} bytes · ${e.durationS} s · ${e.clusters} clusters · ${e.mbps} Mb/s total (video ${e.videoMbps} Mb/s, audio ${e.audioKbps} kb/s ${e.audio})`);
    console.log(`video ${e.codec} ${e.size[0]}x${e.size[1]} · ${e.frames} frames = ${e.fps} fps · ${e.keyframes} keyframes · per-second Mb/s ${e.perSecMbps.join(' ')}`);
    if (out.play) {
      const p = out.play, medOf = (k) => p.rows.map((x) => x[k]).sort((a, b) => a - b)[p.rows.length >> 1], laps = p.rows.map((x) => x.lap).sort((a, b) => a - b), med = medOf('lap'), r14 = medOf('r14'), r18 = medOf('r18');
      console.log(`decoded ${p.size[0]}x${p.size[1]} · ${p.decoded} frames presented, ${p.dropped} dropped · ${p.rows.length} samples every ${STEP} s · lap median ${med} min ${laps[0]} max ${laps[laps.length - 1]} · r14 median ${r14} · r18 median ${r18}`);
      for (const r of p.rows) console.log(`  t ${r.t.toFixed(2).padStart(7)}  lum ${String(r.lum).padStart(6)}  lap ${String(r.lap).padStart(9)}  l4 ${String(r.l4).padStart(8)}  l8 ${String(r.l8).padStart(8)}  r14 ${r.r14}  r18 ${r.r18}`);
    }
  })().catch((e) => { console.log('FAIL', e.stack || e); process.exit(1); });
}
