// Headless Chrome driver over CDP. usage: node tools/cdp.js '<hash>' '<json steps>' [url]
//   hash: 'test' (default when empty) | 'test&scene=0' | 'real' (the real start path: no #test)
//   steps: [{wait:ms},{shot:'name',clip:[x,y,w,h,scale]},{eval:'expr'},{click:[x,y]},{key:'d'},{until:'expr',timeout:ms}]
//   url: page to open (default http://127.0.0.1:PORT/ — tools/serve.js is spawned if nothing answers on PORT)
// env: GPU=1 real GL (default SwiftShader) · NOAUTO=1 no autoplay flag · FAKECAP=1 auto-accept tab capture ·
//      CLOCK=1 deterministic 60 Hz rAF clock: window.__FRAME counts frames; {until:'__FRAME>=360'} pauses the clock at
//        exactly that frame for the shots/evals that follow; the next {wait} resumes it ·
//      FILE=/abs/path.html open a file:// page instead (legacy cardioid mode) · PORT (default 8765) · OUT=dir for shots
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const hash = process.argv[2] || 'test', steps = JSON.parse(process.argv[3] || '[]');
const PORT = +(process.env.PORT || 8765), OUT = process.env.OUT || HERE;
const dbg = 9300 + Math.floor(Math.random() * 500);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const gpu = process.env.GPU ? ['--use-angle=gl', '--ignore-gpu-blocklist'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];

// The fake clock starts ticking at the page's first requestAnimationFrame call, so frame 1 is the first frame of the
// loop on both a sync-script page (v3) and a module page (modules load async).
const CLOCK_SHIM = `(()=>{let f=0,q=[],started=false;const raf=window.requestAnimationFrame.bind(window);
window.requestAnimationFrame=cb=>{q.push(cb);if(!started){started=true;raf(tick);}return q.length;};window.__FRAME=0;window.__PAUSE=0;window.__pauseAt=0;
function tick(){if(window.__PAUSE||(window.__pauseAt&&f>=window.__pauseAt)){window.__PAUSE=1;raf(tick);return;}const l=q;q=[];f++;const t=f*1000/60;window.__FRAME=f;window.__T=t;for(const cb of l)cb(t);raf(tick);}})();`;

async function ensureServer() {
  if (process.env.FILE) return null;
  try { await fetch('http://127.0.0.1:' + PORT + '/'); return null; } catch (e) {}
  const sv = spawn('node', [path.join(HERE, 'serve.js'), String(PORT)], { stdio: 'ignore' });
  for (let i = 0; i < 40; i++) { await sleep(100); try { await fetch('http://127.0.0.1:' + PORT + '/'); return sv; } catch (e) {} }
  throw new Error('serve.js did not start');
}

(async () => {
  const sv = await ensureServer();
  const url = process.env.FILE ? 'file://' + process.env.FILE : (process.argv[4] || 'http://127.0.0.1:' + PORT + '/');
  const ch = spawn('google-chrome', ['--headless=new', '--remote-debugging-port=' + dbg, '--window-size=1280,720',
    ...(process.env.NOAUTO ? [] : ['--autoplay-policy=no-user-gesture-required']),
    ...(process.env.FAKECAP ? ['--auto-select-tab-capture-source-by-title=Eigenwobble', '--auto-accept-this-tab-capture'] : []),
    '--no-first-run', '--user-data-dir=' + HERE + '/chr' + dbg, ...gpu, 'about:blank'], { stdio: 'ignore' });
  let tgt;
  for (let i = 0; i < 40; i++) {
    await sleep(250);
    try { const l = await (await fetch('http://127.0.0.1:' + dbg + '/json')).json(); tgt = l.find((t) => t.type === 'page'); if (tgt) break; } catch (e) {}
  }
  const ws = new WebSocket(tgt.webSocketDebuggerUrl);
  let id = 0;
  const pend = {};
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pend[d.id]) { pend[d.id](d.result || d.error); delete pend[d.id]; }
    else if (d.method === 'Runtime.consoleAPICalled') console.log('[console.' + d.params.type + ']', d.params.args.map((a) => a.value || a.description).join(' ').slice(0, 1500));
    else if (d.method === 'Runtime.exceptionThrown') console.log('[EXC]', JSON.stringify(d.params.exceptionDetails).slice(0, 1200));
  };
  await new Promise((r) => (ws.onopen = r));
  const send = (method, params = {}) => new Promise((r) => { pend[++id] = r; ws.send(JSON.stringify({ id, method, params })); });
  const evaluate = async (expression) => { const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); return r.result ? r.result.value : r; };
  await send('Runtime.enable');
  await send('Page.enable');
  if (process.env.CLOCK) await send('Page.addScriptToEvaluateOnNewDocument', { source: CLOCK_SHIM });
  await send('Page.navigate', { url: url + '#' + hash });
  let fail = 0;
  for (const s of steps) {
    if (s.wait) { if (process.env.CLOCK) await evaluate('window.__pauseAt=0;window.__PAUSE=0'); await sleep(s.wait); }
    if (s.click) for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x: s.click[0], y: s.click[1], button: 'left', clickCount: 1 });
    if (s.key) {
      const k = s.key, code = /^[a-z]$/i.test(k) ? 'Key' + k.toUpperCase() : /^[0-9]$/.test(k) ? 'Digit' + k : k;
      const vk = k.length === 1 ? k.toUpperCase().charCodeAt(0) : k === 'Escape' ? 27 : 0;
      for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, text: type === 'keyDown' && k.length === 1 ? k : undefined });
    }
    if (s.until) {
      const t0 = Date.now(), to = s.timeout || 120000;
      let ok = false;
      // under CLOCK the clock pauses atomically when the predicate turns true, so the following shot/eval sees exactly that frame
      const probe = process.env.CLOCK ? '((' + s.until + ')?(window.__PAUSE=1,true):false)' : '!!(' + s.until + ')';
      const fm = process.env.CLOCK && /^\s*(?:window\.)?__FRAME\s*>=\s*(\d+)\s*$/.exec(s.until); // frame targets: the shim stops exactly there
      if (fm) await evaluate('window.__pauseAt=' + fm[1] + ';window.__PAUSE=0');
      while (Date.now() - t0 < to) { if (await evaluate(probe)) { ok = true; break; } await sleep(40); }
      if (!ok) { console.log('TIMEOUT waiting for', s.until); fail = 1; }
    }
    if (s.eval) { const v = await evaluate(s.eval); console.log('EVAL', s.eval.slice(0, 60), '=>', JSON.stringify(v)); }
    if (s.shot) {
      const r = await send('Page.captureScreenshot', Object.assign({ format: 'jpeg', quality: 85 }, s.clip ? { clip: { x: s.clip[0], y: s.clip[1], width: s.clip[2], height: s.clip[3], scale: s.clip[4] || 1 } } : {}));
      const f = path.isAbsolute(s.shot) ? s.shot + '.jpg' : path.join(OUT, s.shot + '.jpg');
      fs.mkdirSync(path.dirname(f), { recursive: true });
      fs.writeFileSync(f, Buffer.from(r.data, 'base64'));
      console.log('shot', s.shot);
    }
  }
  ws.close();
  ch.kill();
  if (sv) sv.kill();
  await sleep(300);
  fs.rmSync(HERE + '/chr' + dbg, { recursive: true, force: true });
  process.exit(fail);
})();
