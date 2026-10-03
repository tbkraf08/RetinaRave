// The recorder's test (DECISIONS §89, SOCIAL-PLAN §2.8): headless Chrome on the REAL clock (MediaRecorder needs wall time;
// CLOCK=1 would starve it), the demo synth as the source (#test&fake=0: audio on AU.bus without a tab or a file), the keys
// through the public handler (d → HUD on, so the frame grab proves the DOM is not in the clip; R; 4; 2; R). Checks: the
// download name, the sidecar's schema and scene timeline, the webm's duration (its EBML clusters walked here; a MediaRecorder
// webm has no Duration header), the compositor's luminance mid-take (the WebGL canvas was readable on the same task), and
// that assets/core/version.js matches package.json. A frame of the webm at ~1 s is saved as tools/work/rec/frame.jpg to
// look at (the watermark, no HUD). Its own driver, not tools/cdp.js: it needs Browser.setDownloadBehavior and the download
// events. usage: [GPU=1] [PORT=8861] [N=6] [WIN=1280,720] node tools/test_rec.js       (not in `npm test`: it needs Chrome)
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { walk } from './rec_probe.js'; // the EBML walk: the embedded sidecar (§92)

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '..');
const PORT = +(process.env.PORT || 8861), N = +(process.env.N || 6), WIN = process.env.WIN || '1280,720';
const DL = path.join(ROOT, 'tools/work/rec');
const dbg = 9300 + Math.floor(Math.random() * 500);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const gpu = process.env.GPU ? ['--use-angle=gl', '--ignore-gpu-blocklist'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
let fails = 0;
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };

// --- the webm's duration: walk the EBML, the last cluster's timecode + its last block's relative timecode ---
function vint(b, i, keepMarker) {
  const first = b[i];
  let len = 1, mask = 0x80;
  while (len <= 8 && !(first & mask)) { len++; mask >>= 1; }
  let v = keepMarker ? first : first & (mask - 1), unknown = (first & (mask - 1)) === mask - 1;
  for (let k = 1; k < len; k++) { v = v * 256 + b[i + k]; if (b[i + k] !== 0xff) unknown = false; }
  return { v, len, unknown: unknown && !keepMarker };
}
const CONTAINERS = new Set([0x18538067, 0x1f43b675, 0x1549a966, 0xa0]); // Segment, Cluster, Info, BlockGroup
export function webmDurationS(buf) {
  let i = 0, tcScale = 1e6, clusterTc = 0, last = 0, clusters = 0;
  while (i < buf.length - 2) {
    const id = vint(buf, i, true); i += id.len;
    const sz = vint(buf, i, false); i += sz.len;
    if (CONTAINERS.has(id.v)) continue; // descend: unknown or known size, the children follow
    const end = sz.unknown ? buf.length : i + sz.v;
    if (id.v === 0x2ad7b1) { let t = 0; for (let k = i; k < end; k++) t = t * 256 + buf[k]; tcScale = t; }
    else if (id.v === 0xe7) { let t = 0; for (let k = i; k < end; k++) t = t * 256 + buf[k]; clusterTc = t; clusters++; }
    else if (id.v === 0xa3 || id.v === 0xa1) { const tr = vint(buf, i, false); const rel = buf.readInt16BE(i + tr.len); last = Math.max(last, clusterTc + rel); }
    i = end;
  }
  return { s: last * tcScale / 1e9, clusters };
}

async function ensureServer() {
  try { await fetch('http://127.0.0.1:' + PORT + '/'); return null; } catch (e) {}
  const sv = spawn('node', [path.join(HERE, 'serve.js'), String(PORT)], { stdio: 'ignore' });
  for (let i = 0; i < 40; i++) { await sleep(100); try { await fetch('http://127.0.0.1:' + PORT + '/'); return sv; } catch (e) {} }
  throw new Error('serve.js did not start');
}

(async () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const verSrc = fs.readFileSync(path.join(ROOT, 'assets/core/version.js'), 'utf8').match(/VER = '([^']+)'/)[1];
  ok(verSrc === pkg.version, 'assets/core/version.js ' + verSrc + ' == package.json ' + pkg.version + ' (the tag step bumps both)');
  fs.rmSync(DL, { recursive: true, force: true });
  fs.mkdirSync(DL, { recursive: true });
  const sv = await ensureServer();
  const udd = path.join(HERE, 'chr' + dbg);
  const ch = spawn('google-chrome', ['--headless=new', '--window-size=' + WIN, ...gpu, '--remote-debugging-port=' + dbg, '--autoplay-policy=no-user-gesture-required',
    '--no-first-run', '--user-data-dir=' + udd, 'about:blank'], { stdio: 'ignore' });
  const done = async (code) => { try { ch.kill(); } catch (e) {} if (sv) sv.kill(); await sleep(300); fs.rmSync(udd, { recursive: true, force: true }); process.exit(code); };
  try {
    let tgt;
    for (let i = 0; i < 40 && !tgt; i++) { await sleep(250); try { const l = await (await fetch('http://127.0.0.1:' + dbg + '/json')).json(); tgt = l.find((t) => t.type === 'page'); } catch (e) {} }
    const ws = new WebSocket(tgt.webSocketDebuggerUrl);
    let id = 0;
    const pend = {}, downloads = {};
    ws.onmessage = (m) => {
      const d = JSON.parse(m.data);
      if (d.id && pend[d.id]) { pend[d.id](d.result || d.error); delete pend[d.id]; }
      else if (d.method === 'Browser.downloadWillBegin') downloads[d.params.guid] = { name: d.params.suggestedFilename, state: 'begun' };
      else if (d.method === 'Browser.downloadProgress') { if (downloads[d.params.guid]) downloads[d.params.guid].state = d.params.state; }
      else if (d.method === 'Runtime.exceptionThrown') console.log('[EXC]', JSON.stringify(d.params.exceptionDetails).slice(0, 600));
    };
    await new Promise((r) => (ws.onopen = r));
    const send = (method, params = {}) => new Promise((r) => { pend[++id] = r; ws.send(JSON.stringify({ id, method, params })); });
    const ev = async (expression) => { const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) console.log('[EVAL-ERR]', expression.slice(0, 80), JSON.stringify(r.exceptionDetails).slice(0, 300)); return r.result ? r.result.value : undefined; };
    const key = async (k) => { const code = /^[a-z]$/.test(k) ? 'Key' + k.toUpperCase() : 'Digit' + k, vk = k.toUpperCase().charCodeAt(0); for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, text: type === 'keyDown' ? k : undefined }); };
    await send('Runtime.enable');
    await send('Page.enable');
    await send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: DL, eventsEnabled: true });
    await send('Page.navigate', { url: 'http://127.0.0.1:' + PORT + '/#test&fake=0' });
    for (let i = 0; i < 100 && !(await ev('!!(window.CARD && window.__REC)')); i++) await sleep(100);
    await sleep(1500);
    ok(await ev('CARD.AU ? CARD.AU.mode : (window.__REC && 1)') !== undefined, 'page up: #test&fake=0');
    await key('d'); // the HUD on: it is DOM, the frame grab must not show it
    const t0 = Date.now();
    await key('r');
    await sleep(300);
    ok(await ev('__REC.REC.on === true'), 'R starts a take (REC.on)');
    ok(await ev('CARD.Q.hold === 0.75 && CARD.Q.q === 0.75 && CARD.Q.scale === 0.875'), 'the tier is pinned during the take: Q.hold 0.75, q 0.75, scale 0.875 (§92)');
    ok(await ev("getComputedStyle(document.getElementById('recdot')).display === 'block'"), 'the red dot is on (DOM)');
    await sleep(700);
    const lum = await ev("(()=>{const c=document.createElement('canvas');c.width=64;c.height=36;const x=c.getContext('2d');x.drawImage(__REC.cv(),0,0,64,36);const d=x.getImageData(0,0,64,36).data;let s=0;for(let i=0;i<d.length;i+=4)s+=d[i]+d[i+1]+d[i+2];return s/(d.length/4)/3})()");
    ok(lum > 1.5, 'the compositor saw the frame on the same task: mean luminance ' + (lum || 0).toFixed(1) + ' (> 1.5; no preserveDrawingBuffer needed)');
    await sleep(1000);
    await key('4'); // id 3 (torus2) at ~2 s
    const t4 = (Date.now() - t0) / 1000;
    await sleep(2000);
    await key('2'); // id 1 (dust) at ~4 s
    const t2 = (Date.now() - t0) / 1000;
    await sleep(Math.max(0, N * 1000 - (Date.now() - t0)));
    await key('r');
    const tStop = (Date.now() - t0) / 1000;
    for (let i = 0; i < 150; i++) { const l = Object.values(downloads); if (l.length >= 1 && l.every((d) => d.state === 'completed')) break; await sleep(100); }
    await sleep(500);
    const dls = Object.values(downloads);
    ok(dls.length === 1 && dls[0].state === 'completed', 'ONE download completed (the sidecar is inside the webm, §92): ' + dls.map((d) => d.name + ' ' + d.state).join(', '));
    ok(await ev('__REC.REC.on === false'), 'R again stops it (REC.on false)');
    ok(await ev("getComputedStyle(document.getElementById('recdot')).display === 'none'"), 'the red dot is off');
    const webm = dls.find((d) => d.name.endsWith('.webm'));
    const re = /^retinarave-v\d+\.\d+-[a-z0-9-]+-\d{4}-\d\d-\d\dT\d\d-\d\d-\d\d\.webm$/;
    ok(webm && re.test(webm.name), 'the name: ' + (webm && webm.name));
    const buf = fs.readFileSync(path.join(DL, webm.name)), w = walk(buf);
    ok(!!w.sidecar && await ev('__REC.REC.last.embedded === true'), 'the sidecar is embedded (a Tags element before the first Cluster; ffprobe -show_entries format_tags prints tag:COMMENT)');
    const sc = w.sidecar || {};
    ok(JSON.stringify(sc) === await ev('JSON.stringify(__REC.REC.last.sidecar)'), 'the embedded sidecar == REC.last.sidecar byte for byte');
    for (const k of ['app', 'version', 'engineMd5', 'started', 'durationS', 'source', 'track', 'size', 'render', 'dpr', 'fps', 'frames', 'mime', 'bps', 'q', 'q0', 'scenes', 'flags', 'ua']) ok(k in sc, 'sidecar has ' + k + ': ' + JSON.stringify(sc[k]).slice(0, 80));
    ok(sc.app === 'retinarave' && sc.version === pkg.version, 'sidecar app/version = retinarave ' + pkg.version);
    ok(sc.source === 'demo' && sc.track === null, 'sidecar source demo, track null');
    ok(Array.isArray(sc.size) && sc.size[0] >= 16 && sc.fps === 60, 'sidecar size ' + sc.size + ' fps ' + sc.fps);
    ok(Math.abs(sc.durationS - tStop) < 0.7, 'sidecar durationS ' + sc.durationS + ' ≈ ' + tStop.toFixed(2) + ' (the keys)');
    ok(sc.q === 0.75 && typeof sc.q0 === 'number', 'sidecar q 0.75 (the tier held for the take, &recq= default) · q0 ' + sc.q0 + ' (the governor at R; DECISIONS §92)');
    ok(sc.bps === 30e6 && sc.mime === 'video/webm;codecs=vp9,opus' && sc.size[0] === sc.render[0], 'sidecar bps 30e6 · mime vp9,opus · size == render (no &recsize=)');
    ok(await ev('CARD.Q.hold === null && Math.abs(CARD.Q.q - ' + sc.q0 + ') < 0.05'), 'after the stop the governor is free again (Q.hold null) from q0 ' + sc.q0);
    ok(webm.name.includes('-' + sc.scenes[0].name + '-'), 'the name carries the scene at the START: ' + sc.scenes[0].name);
    const ids = sc.scenes.map((s) => s.id);
    ok(sc.scenes[0].t === 0 && ids.includes(3) && ids.includes(1) && ids.indexOf(3) < ids.indexOf(1), 'timeline: start ' + ids[0] + ' → 3 → 1: ' + JSON.stringify(sc.scenes));
    const e3 = sc.scenes.find((s) => s.id === 3), e1 = sc.scenes.find((s) => s.id === 1);
    ok(e3 && Math.abs(e3.t - t4) < 0.6 && e1 && Math.abs(e1.t - t2) < 0.6, 'timeline times within 0.6 s of the key presses (' + (e3 && e3.t) + ' vs ' + t4.toFixed(2) + ', ' + (e1 && e1.t) + ' vs ' + t2.toFixed(2) + ')');
    ok(typeof sc.flags.lead === 'boolean' && typeof sc.flags.shade === 'boolean', 'flags lead/shade are booleans: ' + JSON.stringify(sc.flags));
    ok(buf.length > 50000, 'webm bytes ' + buf.length);
    ok(buf.readUInt32BE(0) === 0x1a45dfa3, 'webm EBML magic');
    const dur = webmDurationS(buf);
    ok(Math.abs(dur.s - sc.durationS) < 0.8, 'webm duration ' + dur.s.toFixed(2) + ' s (' + dur.clusters + ' clusters) ≈ sidecar ' + sc.durationS);
    console.log('info mime ' + sc.mime + ' · frames ' + sc.frames + ' (' + (sc.frames / sc.durationS).toFixed(1) + ' fps composited)');
    // a frame of the webm at ~1 s, to look at: the watermark is in it, the HUD (DOM) is not
    const jpg = await ev("(async()=>{const v=document.createElement('video');v.muted=true;v.src=URL.createObjectURL(__REC.REC.last.blob);await v.play();await new Promise(r=>setTimeout(r,1200));v.pause();const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;c.getContext('2d').drawImage(v,0,0);return c.toDataURL('image/jpeg',0.9)})()");
    ok(jpg && jpg.length > 2000, 'a frame decoded from the webm (' + (jpg ? (jpg.length / 1024).toFixed(0) : 0) + ' KB base64)');
    if (jpg) fs.writeFileSync(path.join(DL, 'frame.jpg'), Buffer.from(jpg.split(',')[1], 'base64'));
    const hud = await ev("(()=>{const h=document.getElementById('hud');return h.style.display==='block'&&h.textContent.length>50})()");
    ok(hud, 'the HUD was on (DOM) during the take — compare tools/work/rec/frame.jpg (no HUD text, the watermark bottom-right)');
    console.log(fails ? 'test_rec: ' + fails + ' FAIL' : 'test_rec: all ok · ' + webm.name + ' · frame tools/work/rec/frame.jpg');
    await done(fails ? 1 : 0);
  } catch (e) { console.log('FAIL', e && e.stack || e); await done(1); }
})();
