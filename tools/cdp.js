// Headless Chrome driver over CDP. usage: node tools/cdp.js '<hash>' '<json steps>' [url]
//   hash: 'test' (default when empty) | 'test&scene=0' | 'real' (the real start path: no #test)
//   steps: [{wait:ms},{shot:'name',clip:[x,y,w,h,scale]},{eval:'expr'},{click:[x,y]},{key:'d'},{until:'expr',timeout:ms}]
//   url: page to open (default http://127.0.0.1:PORT/ — tools/serve.js is spawned if nothing answers on PORT)
// env: GPU=1 real GL (default SwiftShader) · NOAUTO=1 no autoplay flag · FAKECAP=1 auto-accept tab capture ·
//      CLOCK=1 deterministic 60 Hz rAF clock: window.__FRAME counts frames; {until:'__FRAME>=360'} pauses the clock at
//        exactly that frame for the shots/evals that follow; the next {wait} resumes it ·
//      FILE=/abs/path.html open a file:// page instead (legacy cardioid mode) · PORT (default 8765) · OUT=dir for shots ·
//      HEADED=1 a real window on $DISPLAY (v0.2 §17 audit): WIN=1920,1080 (size) · WINPOS=0,0 · DPR=1.5 forces
//        devicePixelRatio · CAPTITLE=<substring> auto-picks that tab (with its audio) in the getDisplayMedia dialog;
//        extra steps: {tab:'url'} opens a second tab in the background ({tab:'url', window:{left,top,width,height}} = its own
//        window) · {evalTab:'expr'} evaluates in that tab · {activate:'tab'|'main'} brings one to the
//        front (the other is hidden) · {bounds:{width,height}} / {bounds:{windowState:'fullscreen'|'normal'}} resizes
//        the real window · {clickSel:'#go'} clicks an element's centre (a trusted click: getDisplayMedia needs one) ·
//        {dblclick:[x,y]} · {sh:'cmd'} runs a shell command mid-run (env DBG = the debug port) and prints its output
import { spawn, execSync } from 'node:child_process';
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
  const headed = !!process.env.HEADED;
  const ch = spawn('google-chrome', [...(headed ? ['--window-position=' + (process.env.WINPOS || '0,0'), '--window-size=' + (process.env.WIN || '1920,1080'),
      ...(process.env.DPR ? ['--force-device-scale-factor=' + process.env.DPR] : []),
      ...(process.env.CAPTITLE ? ['--auto-select-tab-capture-source-by-title=' + process.env.CAPTITLE] : [])]
    : ['--headless=new', '--window-size=1280,720', ...gpu]), '--remote-debugging-port=' + dbg,
    ...(process.env.NOAUTO ? [] : ['--autoplay-policy=no-user-gesture-required']),
    ...(process.env.FAKECAP ? ['--auto-select-tab-capture-source-by-title=Eigenwobble', '--auto-accept-this-tab-capture'] : []),
    '--no-first-run', '--user-data-dir=' + HERE + '/chr' + dbg, 'about:blank'], { stdio: 'ignore' });
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
  const evaluate = async (expression) => { const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) console.log('[EVAL-ERR]', (r.exceptionDetails.exception && r.exceptionDetails.exception.description || r.exceptionDetails.text || '').slice(0, 300)); return r.result ? r.result.value : r; };
  await send('Runtime.enable');
  await send('Page.enable');
  if (process.env.CLOCK) await send('Page.addScriptToEvaluateOnNewDocument', { source: CLOCK_SHIM });
  await send('Page.navigate', { url: url + '#' + hash });
  let fail = 0, tab2 = null;
  const activate = async (targetId) => { await send('Target.activateTarget', { targetId }); };
  for (const s of steps) {
    if (s.tab) { const r = await send('Target.createTarget', { url: s.tab, background: true, newWindow: !!s.window, ...(s.window && s.window.width ? { width: s.window.width, height: s.window.height, left: s.window.left, top: s.window.top } : {}) }); tab2 = r.targetId; const w1 = await send('Browser.getWindowForTarget', { targetId: tgt.id }), w2 = await send('Browser.getWindowForTarget', { targetId: tab2 }); console.log('tab', s.tab.slice(0, 80), tab2 ? 'ok' : JSON.stringify(r), 'windows', w1.windowId, w2.windowId); }
    if (s.activate) await activate(s.activate === 'tab' ? tab2 : tgt.id);
    if (s.evalTab) { const a = await send('Target.attachToTarget', { targetId: tab2, flatten: true }); const r = await new Promise((res) => { pend[++id] = res; ws.send(JSON.stringify({ id, sessionId: a.sessionId, method: 'Runtime.evaluate', params: { expression: s.evalTab, returnByValue: true, awaitPromise: true } })); }); console.log('EVALTAB', s.evalTab.slice(0, 50), '=>', JSON.stringify(r.result ? r.result.value : r)); await send('Target.detachFromTarget', { sessionId: a.sessionId }); }
    if (s.bounds) { const w = await send('Browser.getWindowForTarget', { targetId: tgt.id }); const r = await send('Browser.setWindowBounds', { windowId: w.windowId, bounds: s.bounds }); console.log('bounds', JSON.stringify(s.bounds), r && r.message ? r.message : 'ok'); }
    if (s.sh) { try { console.log('sh', s.sh.slice(0, 60), '=>', execSync(s.sh, { env: { ...process.env, DBG: String(dbg) }, encoding: 'utf8' }).trim().slice(0, 1500)); } catch (e) { console.log('sh FAILED', s.sh.slice(0, 60), String(e.stderr || e).slice(0, 300)); } }
    if (s.wait) { if (process.env.CLOCK) await evaluate('window.__pauseAt=0;window.__PAUSE=0'); await sleep(s.wait); }
    if (s.clickSel) { const r = await evaluate('(()=>{const b=document.querySelector(' + JSON.stringify(s.clickSel) + ').getBoundingClientRect();return [b.x+b.width/2,b.y+b.height/2]})()'); s.click = r; console.log('clickSel', s.clickSel, JSON.stringify(r)); }
    const clicks = s.dblclick ? [[1, s.dblclick], [2, s.dblclick]] : s.click ? [[1, s.click]] : [];
    for (const [clickCount, xy] of clicks) for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x: xy[0], y: xy[1], button: 'left', clickCount });
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
