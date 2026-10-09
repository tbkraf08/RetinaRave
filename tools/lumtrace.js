// Luminance ruler: a legibility trace of one scene over a window of a real track, deterministically (docs/HARNESS.md "Luminance ruler").
//   node tools/lumtrace.js <Track> --scene=0 --from=25 --to=55 [--fps=10] [--w=640] [--sheet=5] [--warm=8] [--port=8831]
//                          [--out=tools/work/lum/<Track>-s<scene>-<from>-<to>] [--x='n2lum=0.28,2.2&n2smo=.12,.5']  (extra hash knobs)
//                          [--jump=1] [--mon=1] [--map=0]   (§109: the two continuity rulers, below; &map=0 = the live lanes)
// Plays <Track> from ~/Music/RetinaRave in FILE mode on the forced scene, under cdp.js's CLOCK=1 deterministic clock (the
// recipe filetrace.js follows: heardT = at + (frame − 2)/60 exactly, WARM seconds of engine warm-up before --from), and
// measures a frame every 1/fps s of TRACK time — in the page, from the GL canvas, on the frame's own task (a rAF registered
// after core/loop.js's, which re-registers at the top of its callback, so the hook runs after the last draw and before the
// compositor takes the buffer — the same read rec.js and probe.js rely on). Each measured frame is drawImage'd into a
// --w px wide 2-D canvas and read with getImageData; no PNG ever leaves the page. Per frame:
//   meanY    mean luma, Y = .2126 R + .7152 G + .0722 B on the sRGB bytes, 0..1
//   p95      the 95th percentile of Y (256-bin histogram)
//   clipFrac the fraction of pixels with Y >= 0.9 (blown out / near white)
//   grad     the structure score: mean |∇Y| over the interior (central differences, Y in 0..1, per pixel at the --w scale) —
//            flat washed areas score low, legible fractal detail scores high
//   centre   mean Y of the centred box covering 20 % of each dimension (tools/lum.py's definition)
//   rim      mean Y of the annulus with r / (shortEdge / 2) in [0.6, 0.9] (lum.py)
// Output: <out>.csv (t,meanY,p95,clipFrac,grad,centre,rim) · <out>.txt a one-screen summary (per-5-s rows: median meanY,
// p90 meanY, mean clipFrac, mean grad, median centre / rim, and the totals; also printed) · <out>-sheet.jpg one 320-px tile
// per --sheet s (0 = none), captioned with t / meanY / clip, 8 per row. Two runs on the same tree agree to the byte (the
// clock, the seeded PRNG and the GL render are all deterministic; a different GPU driver may move a value by 1/255).
// Never touches the user's server on 8765: --port picks the one cdp.js spawns (and kills) for this run. One Chrome at a time.
//
// §109 (tools/real-rulers.sh — every scene on real music): two more rulers in the same deterministic run, both on EVERY frame of
// the window (not every 1/fps s):
//   --jump=1  the PICTURE's continuity (CONTRACTS §1.9 generalised to a scene with no monitor-shaped state): the frame is drawn
//             160 px wide, d = mean |ΔY| against the previous frame; a VIOLATION is the monitor's own rule on the picture —
//             d > 0.06 and d > 2.5·(the previous frame's d) + 0.01 — outside the LEGAL frames, which are the scene's DECLARED cuts
//             (CONTRACTS §1.9, `scene.cuts`) and the 18 frames (0.3 s) after one — the monitor's mode-change grace: 'continuous' →
//             only a drop (dropEvt / dropLiveEvt / mapDropEvt: the slam every scene answers); 'onset' → those + onset / beat / kickEvt /
//             snareEvt / hatEvt; 'event' → the drops + sectionEvt / boundaryEvt / mapBoundaryEvt / surpriseEvt / identifyEvt /
//             resolveEvt + beat / onset / kickEvt (NAV's beat kicks — the kick blend keys on the onset: §109 measured NAV2's picture
//             jump 0.062 on Comptine's 49.317 s onset, hit 0.89, with its cPath still); and, on a scene with a monitor-shaped state, the monitor's own declared cuts
//             (pathCut ≤ 2, a kick rise, a mode change — the chart cut the picture shows is the one the state declares). Smooth fast
//             frames count in `fast`. Also the BLACK frames (mean Y < 0.02): a cold start's first ~0.4 s are black on every scene
//             (the fade-in), so the FAIL rule is a fraction of the window, not zero.
//   --mon=1   tools/monitor.js (the NAV invariant) bound to the scene's OWN state — `CARD.NAV = CARD.REG[scene].scene.state` when that
//             state is monitor-shaped (cPath / pathCut / kick.x / mode / baby: nav2, nav, gielis, chladni, fluid), installed on the
//             window's first frame; a scene with no such state reports mon '-'. Under CLOCK=1 the monitor is frame-timed (§109).
//   Both land in the .txt's last lines (`jump n … viol […]`, `black …`, `mon n … viol […]`) and in <out>.json for a script.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const FPS = 60, F0 = 2, CHUNK = 400000, MAX_CHUNKS = 16;

const args = process.argv.slice(2), opt = {};
const pos = [];
for (const a of args) { const m = /^--([a-z]+)(?:=(.*))?$/.exec(a); if (m) opt[m[1]] = m[2] === undefined ? '1' : m[2]; else pos.push(a); }
const track = pos[0];
if (!track || opt.from === undefined || opt.to === undefined) {
  console.error('usage: node tools/lumtrace.js <Track> --scene=N --from=s --to=s [--fps=10] [--w=640] [--sheet=5] [--warm=8] [--port=8831] [--out=path]');
  process.exit(2);
}
const scene = +(opt.scene || 0), from = +opt.from, to = +opt.to, fps = +(opt.fps || 10), W = +(opt.w || 640);
const JUMP = opt.jump === '1', MONON = opt.mon === '1', MAP0 = opt.map === '0';
const MON_SRC = MONON ? fs.readFileSync(path.join(HERE, 'monitor.js'), 'utf8').split('\n').filter((l) => !l.startsWith('//')).join(' ') : '';
const sheet = opt.sheet === undefined ? 5 : +opt.sheet, WARM = opt.warm === undefined ? 8 : +opt.warm, PORT = opt.port || '8831';
if (!(to > from) || !(fps > 0) || FPS % fps !== 0) { console.error('lumtrace: --to must exceed --from; --fps must divide 60'); process.exit(2); }
const out = path.resolve(ROOT, opt.out || path.join('tools/work/lum', `${track}-s${scene}-${from}-${to}`));
const at = Math.max(0, from - WARM);
const step = Math.round(FPS / fps), sheetStep = sheet > 0 ? Math.round(sheet * FPS) : 0;
const fOf = (T) => F0 + Math.round((T - at) * FPS);
const fStart = fOf(from), fEnd = fOf(to);
const hash = `test&track=${track}&at=${at}&scene=${scene}${MAP0 ? '&map=0' : ''}${opt.x ? '&' + opt.x.replace(/^&/, '') : ''}`;   // --x='n2lum=0.28,2.2&n2smo=…': extra hash knobs for a sweep (§99)

// The in-page hook. Runs once per frame after the engine's draw; measures when (f − fStart) % step == 0 inside [fStart, fEnd].
const INSTALL = `(() => {
  const K = { fStart: ${fStart}, fEnd: ${fEnd}, step: ${step}, sheetStep: ${sheetStep}, at: ${at}, W: ${W}, nSheet: ${sheetStep ? Math.floor((fEnd - fStart) / sheetStep) + 1 : 0}, jump: ${JUMP ? 1 : 0}, mon: ${MONON ? 1 : 0}, scene: ${scene} };
  const gl = CARD.ctx.gl.canvas, w = K.W, h = Math.round(w * gl.height / gl.width);
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const c2 = cv.getContext('2d', { alpha: false, willReadFrequently: true });
  const TW = 320, TH = Math.round(TW * h / w) + 14, cols = Math.min(8, Math.max(1, K.nSheet)), rows = Math.ceil(K.nSheet / cols);
  const sc = document.createElement('canvas'); sc.width = cols * (TW + 4); sc.height = Math.max(1, rows * (TH + 4));
  const s2 = sc.getContext('2d', { alpha: false }); s2.fillStyle = '#222'; s2.fillRect(0, 0, sc.width, sc.height);
  const L = (window.__LT = { rows: [], n: 0, tiles: 0, w, h, cw: gl.width, ch: gl.height, done: false, errs: null, sheet: null, bad: 0,
    J: { n: 0, fast: 0, max: 0, viol: [], black: 0, blackT: [], first: -1 }, MON: null, monShape: false });
  const jw = 160, jh = Math.round(jw * gl.height / gl.width), jc = document.createElement('canvas'); jc.width = jw; jc.height = jh;
  const j2 = jc.getContext('2d', { alpha: false, willReadFrequently: true });
  let jPrev = null, jPd = 0, jLegal = -1, jPk = 0, jPm = null;
  const DROPS = ['dropEvt', 'dropLiveEvt', 'mapDropEvt'], CUTS = (CARD.REG[K.scene] && CARD.REG[K.scene].scene.cuts) || 'continuous';
  const EVTS = CUTS === 'onset' ? DROPS.concat(['onset', 'beat', 'kickEvt', 'snareEvt', 'hatEvt']) : CUTS === 'event' ? DROPS.concat(['sectionEvt', 'boundaryEvt', 'mapBoundaryEvt', 'surpriseEvt', 'identifyEvt', 'resolveEvt', 'beat', 'onset', 'kickEvt']) : DROPS;
  function jump(f) {
    j2.drawImage(gl, 0, 0, jw, jh);
    const d = j2.getImageData(0, 0, jw, jh).data, n = jw * jh, cur = new Float32Array(n);
    let sum = 0, dd = 0;
    for (let i = 0, p = 0; i < n; i++, p += 4) { const y = (0.2126 * d[p] + 0.7152 * d[p + 1] + 0.0722 * d[p + 2]) / 255; cur[i] = y; sum += y; if (jPrev) dd += Math.abs(y - jPrev[i]); }
    const t = K.at + (f - ${F0}) / ${FPS}, S = CARD.MS, J = L.J;
    if (sum / n < 0.02) { J.black++; if (J.blackT.length < 40) J.blackT.push(+t.toFixed(2)); }
    let ev = null; for (const k of EVTS) if (S[k]) { ev = k; break; }
    const st = CARD.REG[K.scene] && CARD.REG[K.scene].scene.state;
    if (st && st.cPath && st.kick && 'pathCut' in st) { if (st.pathCut <= 2 || st.kick.x > jPk + 0.05 || (jPm !== null && st.mode !== jPm)) ev = ev || 'state'; jPk = st.kick.x; jPm = st.mode; }
    if (ev) jLegal = f + 18;
    if (jPrev) {
      const dm = dd / n; J.n++;
      if (f > jLegal) { J.max = Math.max(J.max, dm); if (dm > 0.06) { if (dm > 2.5 * jPd + 0.01) { if (J.viol.length < 40) J.viol.push([+t.toFixed(3), +dm.toFixed(3), +jPd.toFixed(3)]); else J.viol.length++; } else J.fast++; } }
      jPd = dm;
    }
    jPrev = cur;
  }
  const Y = new Float32Array(w * h), hist = new Uint32Array(256);
  const cx = w / 2, cy = h / 2, half = Math.min(w, h) / 2;
  function measure(f) {
    c2.drawImage(gl, 0, 0, w, h);
    const d = c2.getImageData(0, 0, w, h).data;
    hist.fill(0);
    let sum = 0, clip = 0, cs = 0, cn = 0, rs = 0, rn = 0;
    for (let i = 0, p = 0; i < Y.length; i++, p += 4) {
      const y = (0.2126 * d[p] + 0.7152 * d[p + 1] + 0.0722 * d[p + 2]) / 255;
      Y[i] = y; sum += y; hist[Math.round(y * 255)]++; if (y >= 0.9) clip++;
      const x = i % w, yy = (i - x) / w;
      if (Math.abs(x - cx) <= 0.1 * w && Math.abs(yy - cy) <= 0.1 * h) { cs += y; cn++; }
      const r = Math.sqrt((x - cx) * (x - cx) + (yy - cy) * (yy - cy)) / half;
      if (r >= 0.6 && r <= 0.9) { rs += y; rn++; }
    }
    const N = Y.length;
    let acc = 0, p95 = 0; for (let b = 0; b < 256; b++) { acc += hist[b]; if (acc >= 0.95 * N) { p95 = b / 255; break; } }
    let g = 0, gn = 0;
    for (let yy = 1; yy < h - 1; yy++) for (let x = 1; x < w - 1; x++) {
      const i = yy * w + x, gx = (Y[i + 1] - Y[i - 1]) / 2, gy = (Y[i + w] - Y[i - w]) / 2;
      g += Math.sqrt(gx * gx + gy * gy); gn++;
    }
    const t = K.at + (f - ${F0}) / ${FPS};
    const row = [t, sum / N, p95, clip / N, g / gn, cs / Math.max(cn, 1), rs / Math.max(rn, 1)];
    L.rows.push(row);
    if (K.sheetStep && (f - K.fStart) % K.sheetStep === 0 && L.tiles < K.nSheet) {
      const k = L.tiles++, x0 = (k % cols) * (TW + 4), y0 = Math.floor(k / cols) * (TH + 4);
      s2.drawImage(cv, x0, y0 + 14, TW, TH - 14);
      s2.fillStyle = '#222'; s2.fillRect(x0, y0, TW, 14);
      s2.fillStyle = '#c8e6c8'; s2.font = '11px monospace';
      s2.fillText('t ' + t.toFixed(2) + '  Y ' + row[1].toFixed(3) + '  clip ' + row[3].toFixed(3) + '  grad ' + row[4].toFixed(4), x0 + 3, y0 + 11);
    }
  }
  function tick() {
    if (L.done) return;
    requestAnimationFrame(tick);
    const f = window.__FRAME;
    if (f < K.fStart || f > K.fEnd) return;
    if (K.mon && L.MON === null && f >= K.fStart) {
      const R = CARD.REG[K.scene], st = R && R.scene && R.scene.state;
      L.monShape = !!(st && st.cPath && st.kick && 'pathCut' in st);
      if (L.monShape) { CARD.NAV = st; ${MON_SRC}; L.MON = window.MON; } else L.MON = false;
    }
    if (K.jump) { try { jump(f); } catch (e) { L.bad++; L.errs = String(e); } }
    if ((f - K.fStart) % K.step !== 0) return;
    try { measure(f); L.n++; } catch (e) { L.bad++; L.errs = String(e); }
    if (f + K.step > K.fEnd) { L.done = true; L.sheet = K.nSheet ? sc.toDataURL('image/jpeg', 0.85) : ''; }
  }
  requestAnimationFrame(tick);
  return JSON.stringify({ w, h, cw: gl.width, ch: gl.height, fStart: K.fStart, fEnd: K.fEnd, step: K.step, nSheet: K.nSheet });
})()`.replace(/\n\s*/g, ' '); // one line: cdp.js echoes the first 60 characters of an eval on the EVAL line
const HEAD = 'JSON.stringify({f0:CARD.ENGINE.AU.file.frame0,sr:CARD.ENGINE.AU.file.sr,dur:CARD.ENGINE.AU.file.dur,det:CARD.ENGINE.AU.file.det,at:CARD.ENGINE.AU.file.at,scene:CARD.SC.cur,forced:CARD.SC.forced})';
const RESULT = `(()=>{const L=window.__LT;if(!L.done){L.done=true;L.sheet=L.sheet||'';}window.__lj=JSON.stringify({rows:L.rows,sheet:L.sheet,J:L.J,MON:L.MON?{n:L.MON.n,fast:L.MON.fast,max:+L.MON.max.toFixed(4),viol:L.MON.viol}:L.MON,monShape:L.monShape,cuts:(CARD.REG[${scene}]&&CARD.REG[${scene}].scene.cuts)||null,name:(CARD.REG[${scene}]&&CARD.REG[${scene}].scene.name)||null,mapOn:CARD.MS.mapOn});return JSON.stringify({len:window.__lj.length,n:L.n,tiles:L.tiles,bad:L.bad,errs:L.errs,frame:window.__FRAME,heard:CARD.MS.heardT,scene:CARD.SC.cur,pageErrs:CARD.ERRS,nonFinite:CARD.nonFinite?CARD.nonFinite():null,ms:+CARD.ENGINE.ms.toFixed(3)})})()`;

const steps = [
  { until: 'window.CARD', timeout: 60000 },
  { until: 'window.CARD.ENGINE.AU.file && window.CARD.ENGINE.AU.file.open', timeout: 300000 },
  { eval: HEAD },
  { eval: INSTALL },
  { until: 'window.__FRAME>=' + fEnd, timeout: 1200000 },
  { eval: RESULT },
  ...Array.from({ length: MAX_CHUNKS }, (_, i) => ({ eval: `window.__lj.slice(${i * CHUNK},${(i + 1) * CHUNK})` })),
];

const env = Object.assign({}, process.env, { GPU: '1', CLOCK: '1', PORT: String(PORT), OUT: path.join(HERE, 'work') });
console.log(`lumtrace: ${track} scene ${scene} [${from}, ${to}] s · at ${at} (warm ${WARM} s) · frames ${fStart}..${fEnd} every ${step} (${fps} fps) · ${W} px · port ${PORT}`);
const ch = spawn('node', [path.join(HERE, 'cdp.js'), hash, JSON.stringify(steps)], { env, maxBuffer: 1 << 28 });
let buf = '';
ch.stdout.on('data', (d) => (buf += d));
ch.stderr.on('data', (d) => process.stderr.write(d));
ch.on('exit', (code) => {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out + '.log', buf); // the raw cdp output (console, [EXC], every EVAL) for a post-mortem
  const lines = buf.split('\n');
  const evals = lines.filter((l) => l.startsWith('EVAL ')).map((l) => l.slice(l.lastIndexOf(' => ') + 4)); // the LAST arrow: an arrow function's 60-character echo carries '=> ' too
  const errs = lines.filter((l) => l.startsWith('[EXC]') || l.startsWith('[console.error]') || l.startsWith('TIMEOUT') || l.startsWith('[EVAL-ERR]'));
  const un = (s) => { try { return JSON.parse(s); } catch (e) { return null; } };
  const dbl = (s) => un(un(s || 'null') || 'null');
  const H = dbl(evals[0]), I = dbl(evals[1]), meta = dbl(evals[evals.length - MAX_CHUNKS - 1]);
  if (errs.length) console.log('page errors:', errs.slice(0, 4).join(' | '));
  if (!meta || !I) { console.log('lumtrace: nothing came back (exit ' + code + ')'); console.log(lines.slice(-12).join('\n')); process.exit(1); }
  if (H && H.f0 !== F0) console.log(`lumtrace: WARNING frame0 is ${H.f0}, not ${F0} — the window is off by ${(H.f0 - F0) / FPS} s`);
  if (H && H.scene !== scene) console.log(`lumtrace: WARNING the page is on scene ${H.scene}, not ${scene} (forced ${H.forced})`);
  const json = evals.slice(evals.length - MAX_CHUNKS).map((s) => un(s) || '').join('');
  if (json.length !== meta.len) { console.log(`lumtrace: got ${json.length} of ${meta.len} characters — raise MAX_CHUNKS`); process.exit(1); }
  const R = un(json);
  const rows = R.rows;
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const cols = ['t', 'meanY', 'p95', 'clipFrac', 'grad', 'centre', 'rim'];
  fs.writeFileSync(out + '.csv', cols.join(',') + '\n' + rows.map((r) => r.map((v, i) => i === 0 ? v.toFixed(4) : v.toFixed(5)).join(',')).join('\n') + '\n');
  if (R.sheet) fs.writeFileSync(out + '-sheet.jpg', Buffer.from(R.sheet.slice(R.sheet.indexOf(',') + 1), 'base64'));

  // the one-screen summary: per-5-s rows and the totals
  const med = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.floor((s.length - 1) / 2)] : NaN; };
  const q = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(p * (s.length - 1) + 0.5))] : NaN; };
  const mean = (a) => a.reduce((x, y) => x + y, 0) / Math.max(a.length, 1);
  const line = (label, rs) => {
    const c = (i) => rs.map((r) => r[i]);
    return `${label.padEnd(9)} ${med(c(1)).toFixed(3)}  ${q(c(1), 0.9).toFixed(3)}  ${mean(c(3)).toFixed(3)}  ${Math.max(...c(3)).toFixed(3)}  ${mean(c(4)).toFixed(4)}  ${med(c(5)).toFixed(3)}  ${med(c(6)).toFixed(3)}  ${String(rs.length).padStart(3)}`;
  };
  const txt = [];
  txt.push(`lumtrace ${track} scene ${scene} [${from}, ${to}] s · ${fps} fps · ${I.w}x${I.h} from ${I.cw}x${I.ch} · ${rows.length} frames · heard ${rows.length ? rows[0][0].toFixed(3) : '?'} → ${rows.length ? rows[rows.length - 1][0].toFixed(3) : '?'}`);
  txt.push(`window    medY   p90Y   clip   clipMx grad    ctr    rim      n`);
  for (let a = from; a < to; a += 5) {
    const b = Math.min(a + 5, to);
    const rs = rows.filter((r) => r[0] >= a - 1e-6 && (r[0] < b - 1e-6 || (b === to && r[0] <= b + 1e-6)));
    if (rs.length) txt.push(line(`${a}-${b}`, rs));
  }
  txt.push(line('ALL', rows));
  txt.push(`clipFrac >= 0.25 on ${rows.filter((r) => r[3] >= 0.25).length} of ${rows.length} frames · meanY >= 0.6 on ${rows.filter((r) => r[1] >= 0.6).length} · min grad ${Math.min(...rows.map((r) => r[4])).toFixed(4)} at t ${rows.length ? rows.reduce((m, r) => (r[4] < m[4] ? r : m))[0].toFixed(2) : '?'}`);
  if (JUMP) {
    const J = R.J, nf = J.n + 1;
    txt.push(`jump n ${J.n} · fast ${J.fast} · max ${J.max.toFixed(4)} · viol ${JSON.stringify(J.viol)}`);
    txt.push(`black ${J.black} of ${nf} frames (mean Y < 0.02 at 160 px)${J.black ? ' at t ' + J.blackT.join(' ') + (J.black > J.blackT.length ? ' …' : '') : ''}`);
  }
  if (MONON) txt.push(R.MON ? `mon n ${R.MON.n} · fast ${R.MON.fast} · max ${R.MON.max} · viol ${JSON.stringify(R.MON.viol)}` : `mon - (${R.name || 'scene ' + scene} has no monitor-shaped state; cuts '${R.cuts}')`);
  if (JUMP || MONON) fs.writeFileSync(out + '.json', JSON.stringify({ track, scene, name: R.name, cuts: R.cuts, from, to, warm: WARM, map: MAP0 ? 0 : 1, mapOn: R.mapOn, frames: rows.length, clip25: rows.filter((r) => r[3] >= 0.25).length, bright: rows.filter((r) => r[1] >= 0.6).length, medY: med(rows.map((r) => r[1])), grad: mean(rows.map((r) => r[4])), J: JUMP ? R.J : null, MON: MONON ? R.MON : null, monShape: R.monShape, pageErrs: meta.pageErrs, nonFinite: meta.nonFinite, bad: meta.bad }) + '\n');
  txt.push(`tiles ${meta.tiles} · bad ${meta.bad}${meta.errs ? ' (' + meta.errs + ')' : ''} · page errs ${JSON.stringify(meta.pageErrs)} · nonFinite ${JSON.stringify(meta.nonFinite)} · ENGINE.ms ${meta.ms} · f0 ${H ? H.f0 : '?'} · sr ${H ? H.sr : '?'} · end frame ${meta.frame} heard ${meta.heard}`);
  txt.push(`files: ${path.relative(ROOT, out)}.csv · ${path.relative(ROOT, out)}.txt${R.sheet ? ' · ' + path.relative(ROOT, out) + '-sheet.jpg' : ''}`);
  fs.writeFileSync(out + '.txt', txt.join('\n') + '\n');
  console.log(txt.join('\n'));
  process.exit(errs.length || meta.bad ? 1 : 0);
});
