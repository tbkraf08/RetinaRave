// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// NAV2's jump counter — the goldilocks ruler for the Misiurewicz kick (DECISIONS §100). Three modes:
//   record  node tools/navkicks.js record <Track> <from> <to> [--port=8851] [--warm=8]
//           One deterministic headless run (cdp.js CLOCK=1 GPU=1, the lumtrace / filetrace recipe) of <Track> in FILE mode
//           from <from> − warm to <to>; every numeric / boolean MS field per frame (CARD.TRACE, the frozen trace format) plus
//           the three non-recordable fields nav.js reads (arc, seed.a, seed.th) from a rAF hook → tools/work/navkicks/<Track>-<from>-<to>.json
//   replay  node tools/navkicks.js replay <json> [--x='n2kick=0.5,0.15&n2breath=0.3'] [--from=.. --to=..] [--rows=5]
//           Drives nav2's real update() (tools/test_nav2.js's harness: the ray grid seeded in node) over the recorded MS at
//           60 Hz, the knobs applied through the scene's own hooks; the navigator warms over the trace's first seconds and
//           the window [from, to] is counted: jumps (a kick rise — whichever gate fired it), bars, jumps per bar, the same per
//           --rows s, the continuity monitor's rule (tools/monitor.js: viol / fast / max), the largest per-frame cPath step.
//           §101: the PLACES ruler — distinct places dwelt ≥ 1 bar (a bulb p/q in M or a baby, or the exterior by its θ in 24ths)
//           per minute of the window, the visits, and Green's Q (nav2/green.js, measured on id 0 too) as medians over the window's
//           INT frames, loud rows (loudRel ≥ .6) against quiet rows (< .4).
//   sweep   node tools/navkicks.js sweep <json>... --list='NAV|n2kick=0|n2kick=0.31|n2kick=0.5' [--rows=5] [--places=1]  ('NAV' = id 0, the control)
//           One replay per (trace, setting) in its own process (the navigator is a module singleton), one table.
// The trace is MS as the page published it, so the sweep is pure node and a setting costs a second, not a Chrome run.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const FPS = 60, F0 = 2, CHUNK = 400000, MAX_CHUNKS = 80;   // §101: a 120 s trace is ~17 MB
const args = process.argv.slice(2), opt = {}, pos = [];
for (const a of args) { const m = /^--([a-z]+)(?:=(.*))?$/.exec(a); if (m) opt[m[1]] = m[2] === undefined ? '1' : m[2]; else pos.push(a); }
const mode = pos.shift();
const info0 = (i) => (i ? i.bulb : '');
const outDir = path.join(ROOT, 'tools/work/navkicks');

if (mode === 'record') record();
else if (mode === 'replay') await replay();
else if (mode === 'sweep') sweep();
else { console.error('usage: navkicks.js record <Track> <from> <to> | replay <json> [--x=..] | sweep <json>.. --list=..'); process.exit(2); }

function record() {
  const [track, fromS, toS] = pos;
  if (!track || fromS === undefined || toS === undefined) { console.error('record <Track> <from> <to>'); process.exit(2); }
  const from = +fromS, to = +toS, WARM = opt.warm === undefined ? 8 : +opt.warm, PORT = opt.port || '8851';
  const at = Math.max(0, from - WARM), fEnd = F0 + Math.round((to - at) * FPS);
  const hash = `test&track=${track}&at=${at}&scene=8`;
  const START = `(()=>{CARD.TRACE.start('*');window.__X={t:[],arc:[],sa:[],sth:[]};const X=window.__X;function f(){const S=CARD.MS;X.t.push(S.heardT);X.arc.push(S.arc);X.sa.push(S.seed?S.seed.a:0);X.sth.push(S.seed?S.seed.th:0);requestAnimationFrame(f);}requestAnimationFrame(f);return 'rec'})()`;
  const STOP = `(()=>{const j=CARD.TRACE.stop();j.extra=window.__X;window.__tj=JSON.stringify(j);return JSON.stringify({len:window.__tj.length,frames:j.f.length,xt:j.extra.t.length,fields:j.fields.length,t0:j.t[0],t1:j.t[j.t.length-1],errs:CARD.ERRS})})()`;
  const steps = [
    { until: 'window.CARD', timeout: 60000 },
    { until: 'window.CARD.ENGINE.AU.file && window.CARD.ENGINE.AU.file.open', timeout: 300000 },
    { eval: START },
    { until: 'window.__FRAME>=' + fEnd, timeout: 1200000 },
    { eval: STOP },
    ...Array.from({ length: MAX_CHUNKS }, (_, i) => ({ eval: `window.__tj.slice(${i * CHUNK},${(i + 1) * CHUNK})` })),
  ];
  const env = Object.assign({}, process.env, { GPU: '1', CLOCK: '1', PORT: String(PORT), OUT: path.join(HERE, 'work') });
  console.log(`navkicks record: ${track} [${from}, ${to}] at ${at} (warm ${WARM}) frames ..${fEnd} port ${PORT}`);
  const ch = spawn('node', [path.join(HERE, 'cdp.js'), hash, JSON.stringify(steps)], { env, maxBuffer: 1 << 28 });
  let buf = '';
  ch.stdout.on('data', (d) => (buf += d));
  ch.stderr.on('data', (d) => process.stderr.write(d));
  ch.on('exit', (code) => {
    const lines = buf.split('\n');
    const evals = lines.filter((l) => l.startsWith('EVAL ')).map((l) => l.slice(l.lastIndexOf(' => ') + 4));
    const un = (s) => { try { return JSON.parse(s); } catch (e) { return null; } };
    const meta = un(un(evals[1] || 'null') || 'null');
    if (!meta) { console.log('navkicks: nothing came back (exit ' + code + ')\n' + lines.slice(-8).join('\n')); process.exit(1); }
    const json = evals.slice(2, 2 + MAX_CHUNKS).map((s) => un(s) || '').join('');
    if (json.length !== meta.len) { console.log(`navkicks: got ${json.length} of ${meta.len} characters`); process.exit(1); }
    fs.mkdirSync(outDir, { recursive: true });
    const out = path.join(outDir, `${track}-${from}-${to}.json`);
    const J = JSON.parse(json);
    J.window = { track, from, to, at, warm: WARM };
    fs.writeFileSync(out, JSON.stringify(J));
    console.log(`navkicks: ${meta.frames} frames (${meta.xt} hook rows) · ${meta.fields} fields · heard ${meta.t0} → ${meta.t1} · errs ${JSON.stringify(meta.errs)} → ${path.relative(ROOT, out)}`);
    process.exit(meta.errs && meta.errs.length ? 1 : 0);
  });
}

async function replay() {
  const file = pos[0];
  if (!file) { console.error('replay <json>'); process.exit(2); }
  const J = JSON.parse(fs.readFileSync(file, 'utf8'));
  const from = opt.from !== undefined ? +opt.from : J.window.from, to = opt.to !== undefined ? +opt.to : J.window.to, ROWS = +(opt.rows || 5);
  const scene = (await import(opt.nav ? '../assets/scenes/nav/index.js' : '../assets/scenes/nav2/index.js')).default;   // --nav=1: NAV itself (id 0), the control
  if (!scene.hooks.n2info) scene.hooks.n2info = () => ({ fires: 0, bulb: scene.state.bulb.p + '/' + scene.state.bulb.q });
  const { buildRayGrid, setGrid, GRIDP } = await import('../assets/math/mandel.js');
  const { measure, G } = await import('../assets/scenes/nav2/green.js');   // §101: the same ruler on id 0 (nav2's update() measures by itself)
  const { baseLight } = await import('../assets/math/loudlight.js');   // §101: loud / quiet rows on the track's own ladder (walk2.js's rule)
  setGrid(buildRayGrid(...GRIDP));
  const xs = (opt.x || '').split('&').map((s) => s.trim()).filter(Boolean);
  for (const kv of xs) { const i = kv.indexOf('='); const k = i < 0 ? kv : kv.slice(0, i), v = i < 0 ? '' : kv.slice(i + 1); if (typeof scene.hooks[k] !== 'function') { console.error('no hook ' + k); process.exit(2); } scene.hooks[k](v); }
  const N = scene.state, X = J.extra || {}, F = J.fields, C = J.cols, n = J.f.length;
  // align the hook rows to the trace rows by heard time (both read the same MS; the hook may start a frame apart)
  const xi = new Int32Array(n).fill(-1);
  if (X.t) { let j = 0; for (let i = 0; i < n; i++) { while (j < X.t.length - 1 && X.t[j] < J.t[i] - 1e-6) j++; if (Math.abs(X.t[j] - J.t[i]) < 1e-6) xi[i] = j; } }
  const MS = { seed: { hue: 0.6, th: -0.29, a: 0.17, scene: -1 }, peaks: [[110, 1], [220, 0.6], [330, 0.5], [550, 0.3]], arc: 'sustain' };
  const dt = 1 / 60, P = {};
  const rows = [], R = () => ({ jumps: 0, bars: 0, bc0: NaN, bc1: NaN, viol: [], fast: 0, max: 0, maxAll: 0, maxInt: 0, dInt: [], sw: [], n: 0, int: 0, fires: 0 });
  const tot = R();
  let pc = null, pk = 0, pm = '', pd = 0, tm = -999, bcPrev = NaN, swLo = 9, swHi = -9, lastInfo = null;
  const runs = [], qL = [], qQ = [], qA = [];   // §101: the places (runs of one key), Green's Q by loudness
  let run = null;
  // the place: a bulb past its root (P<n>: inside a baby), the cardioid (0/1 when it is the target and c is off the rim), the exterior as ONE state
  // (its landing θ per excursion is listed apart: `land`), 'rim' / 'bridge' = in transit (never a place)
  const keyOf = () => N.mode === 'INT' ? (N.h.x > 0.02 ? (N.baby ? 'P' + N.baby.P + ':' : '') + N.bulb.p + '/' + N.bulb.q : N.target.q === 1 && N.bulb.q === 1 && N.h.x < -0.02 ? '0/1' : 'rim') : N.mode === 'OUT' || N.mode === 'IN' ? 'bridge' : 'EXT';
  const land = [];   // per exterior excursion: the θ bucket (24ths) at its first frame
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < F.length; k++) MS[F[k]] = C[F[k]][i];
    if (xi[i] >= 0) { MS.arc = X.arc[xi[i]]; MS.seed.a = X.sa[xi[i]]; MS.seed.th = X.sth[xi[i]]; }
    const t = J.t[i];
    for (const k in scene.params) P[k] = scene.params[k].from(MS);
    scene.update(dt, MS, {}, {}, { SC: { logical: scene.id, vT: 0 }, params: P, now: t, Q: {} });
    const c = [N.cPath[0], N.cPath[1]], inWin = t >= from - 1e-6 && t <= to + 1e-6;
    if (opt.nav) measure(N.c[0], N.c[1], dt);
    if (inWin) {
      const key = keyOf();
      if (!run || run.key !== key) { if (run) runs.push(run); run = { key, bc0: MS.beatCount, bc1: MS.beatCount, t0: t }; if (key === 'EXT') land.push(((Math.round((N.th.x - Math.floor(N.th.x)) * 24) % 24) + 24) % 24); } else run.bc1 = MS.beatCount;
      if (N.mode === 'INT' && N.cyc.has) { const L = baseLight(MS.loudRel, MS.loudRange, MS.loudAbs, MS.eS); qA.push(G.Q); if (L >= 0.6) qL.push(G.Q); else if (L < 0.4) qQ.push(G.Q); }
    }
    // the radius's swing per beat inside a bulb (ρ = e^lnr of the cycle chart): max − min over each beat, the breath's own size
    if (inWin && N.mode === 'INT' && N.h.x > 0.02 && N.cyc.has) { const rho = Math.exp(N.cyc.lnr); if (MS.beatCount !== bcPrev) { if (swLo < 9) { tot.sw.push(swHi - swLo); rowOf(t).sw.push(swHi - swLo); } swLo = rho; swHi = rho; bcPrev = MS.beatCount; } else { swLo = Math.min(swLo, rho); swHi = Math.max(swHi, rho); } }
    const info = scene.hooks.n2info();
    if (opt.trace) { const [a, b] = opt.trace.split(',').map(Number); if (t >= a && t <= b) console.log(`TR t ${t.toFixed(3)} ${N.mode} h ${N.h.x.toFixed(4)} a ${N.alpha.x.toFixed(4)} bulb ${N.bulb.p}/${N.bulb.q} tgt ${N.target.p}/${N.target.q} want ${N.want ? N.want.P : 0} hold ${N.hold} baby ${N.baby ? N.baby.P : 0} cut ${N.pathCut} kick ${N.kick.x.toFixed(3)} c ${c[0].toFixed(4)},${c[1].toFixed(4)} iv ${MS.interval} rep ${MS.repeat} place ${info.wplace} due ${info.wdue} k ${info.wk}`); }
    if (opt.w && lastInfo && info.wsteps !== lastInfo.wsteps) console.log(`W2 t ${t.toFixed(1)} bc ${MS.beatCount} step ${info.wsteps} k ${info.wk} pick "${info.wpick}" of [${info.wcands}] interval ${MS.interval} mode ${N.mode} bulb ${info.bulb}`);
    if (pc) {
      if (N.mode !== pm) tm = i;
      const d = Math.hypot(c[0] - pc[0], c[1] - pc[1]) / (N.baby ? N.baby.size : 1);
      const rise = N.kick.x > pk + 0.05;
      const legal = N.pathCut <= 2 || rise || N.mode !== pm || i - tm < 18;
      if (inWin) {
        const r = rowOf(t);
        for (const o of [tot, r]) {
          o.n++;
          if (N.mode === 'INT') { o.int++; if (legal === false) { o.maxInt = Math.max(o.maxInt, d); o.dInt.push(d); } }
          if (rise) o.jumps++;
          o.maxAll = Math.max(o.maxAll, d);
          if (!legal) { o.max = Math.max(o.max, d); if (d > 0.06) { if (d > 2.5 * pd + 0.01) o.viol.push([+t.toFixed(2), +d.toFixed(4), +pd.toFixed(4), N.mode]); else o.fast++; } }
          if (isNaN(o.bc0)) o.bc0 = MS.beatCount;
          o.bc1 = MS.beatCount;
          o.fires += info.fires - (lastInfo ? lastInfo.fires : 0);
        }
      }
      pd = d;
    }
    lastInfo = info;
    pc = c; pk = N.kick.x; pm = N.mode;
  }
  function rowOf(t) { const k = Math.floor((t - from) / ROWS); while (rows.length <= k) rows.push(R()); return rows[k]; }
  const fin = (o) => { o.bars = (o.bc1 - o.bc0) / 4; o.jpb = o.bars > 0 ? +(o.jumps / o.bars).toFixed(2) : null; o.intShare = +(o.int / Math.max(1, o.n)).toFixed(2); delete o.bc0; delete o.bc1; delete o.int; o.max = +o.max.toFixed(4); o.maxAll = +o.maxAll.toFixed(4); o.maxInt = +o.maxInt.toFixed(4); const q = o.dInt.sort((a, b) => a - b); o.p99Int = q.length ? +q[Math.floor(0.99 * (q.length - 1))].toFixed(4) : 0; o.meanInt = q.length ? +(q.reduce((a, b) => a + b, 0) / q.length).toFixed(5) : 0; delete o.dInt; const w = o.sw.sort((a, b) => a - b); o.swN = w.length; o.swMed = w.length ? +w[Math.floor((w.length - 1) / 2)].toFixed(4) : 0; o.swP90 = w.length ? +w[Math.floor(0.9 * (w.length - 1))].toFixed(4) : 0; delete o.sw; return o; };
  fin(tot); rows.forEach(fin);
  if (run) runs.push(run);
  const dwelt = runs.filter((r) => r.bc1 - r.bc0 >= 4 && r.key !== 'rim' && r.key !== 'bridge'), placeSet = new Set(dwelt.map((r) => r.key));
  const med = (a) => { if (!a.length) return null; const b = a.slice().sort((x, y) => x - y); return +b[Math.floor((b.length - 1) / 2)].toFixed(3); };
  const places = { n: placeSet.size, ppm: +(placeSet.size / ((to - from) / 60)).toFixed(2), visits: dwelt.length, list: dwelt.map((r) => r.key + ':' + (r.bc1 - r.bc0)).join(' '), land: land.join(' '), landings: new Set(land).size, qLoud: med(qL), qQuiet: med(qQ), qAll: med(qA), nLoud: qL.length, nQuiet: qQ.length };
  const label = `${J.window.track} ${from}-${to}${opt.nav ? ' NAV' : ''}`;
  const out = { label, x: opt.x || '', jumps: tot.jumps, bars: +tot.bars.toFixed(2), jpb: tot.jpb, fires: tot.fires, viol: tot.viol, fast: tot.fast, max: tot.max, maxInt: tot.maxInt, p99Int: tot.p99Int, meanInt: tot.meanInt, swN: tot.swN, swMed: tot.swMed, swP90: tot.swP90, maxAll: tot.maxAll, intShare: tot.intShare,
    rows: rows.map((r, k) => ({ t: from + k * ROWS, jumps: r.jumps, bars: +r.bars.toFixed(2), jpb: r.jpb, int: r.intShare, max: r.max })), last: { mode: N.mode, bulb: info0(lastInfo) }, places };
  console.log('NK ' + JSON.stringify(out));
  if (opt.runs) console.log('RUNS ' + runs.map((r) => `${r.key}@${r.t0.toFixed(1)}:${r.bc1 - r.bc0}`).join(' '));
  if (opt.verbose) console.log(`aligned hook rows ${Array.from(xi).filter((v) => v >= 0).length} of ${n} · viol ${JSON.stringify(tot.viol)}`);
  console.log(`${label} x=${out.x || '-'}: PLACES ${places.n} (${places.ppm} per min, ${places.visits} visits) [${places.list}] · EXT landings θ/24 [${places.land}] (${places.landings} distinct) · Q loud ${places.qLoud} (${places.nLoud}) quiet ${places.qQuiet} (${places.nQuiet}) all ${places.qAll}`);
  console.log(`${label} x=${out.x || '-'}: ${tot.jumps} jumps / ${tot.bars.toFixed(1)} bars = ${tot.jpb} per bar · INT ${tot.intShare} · viol ${tot.viol.length} fast ${tot.fast} max ${tot.max} (INT max ${tot.maxInt} p99 ${tot.p99Int} mean ${tot.meanInt}, all ${tot.maxAll}) · ρ swing per beat med ${tot.swMed} p90 ${tot.swP90} (${tot.swN} beats in a bulb) · rows ${rows.map((r) => r.jpb === null ? '-' : r.jpb).join(' ')}`);
}


function sweep() {
  const files = pos, list = (opt.list || '').split('|').map((s) => s.trim());
  if (!files.length || !list.length) { console.error('sweep <json>.. --list=a|b|c'); process.exit(2); }
  const table = [];
  for (const x of list) {
    const row = { x, cells: [] };
    for (const f of files) {
      const a = [path.join(HERE, 'navkicks.js'), 'replay', f, x === 'NAV' ? '--nav=1' : '--x=' + x];   // 'NAV' = id 0 itself, the control
      if (opt.rows) a.push('--rows=' + opt.rows);
      if (opt.from) a.push('--from=' + opt.from);
      if (opt.to) a.push('--to=' + opt.to);
      const r = spawnSync('node', a, { encoding: 'utf8', maxBuffer: 1 << 26 });
      const l = (r.stdout || '').split('\n').find((s) => s.startsWith('NK '));
      if (!l) { console.error(r.stderr || r.stdout); process.exit(1); }
      row.cells.push(JSON.parse(l.slice(3)));
    }
    table.push(row);
    console.log(`${x.padEnd(28)} ${row.cells.map((c) => opt.places ? `P${String(c.places.n).padStart(2)} ${String(c.places.ppm).padStart(5)}/min v${String(c.places.visits).padStart(2)} L${c.places.landings}[${c.places.land}] Q${c.places.qLoud}/${c.places.qQuiet} jpb${c.jpb} viol${c.viol.length} m${c.max.toFixed(3)}` : `${String(c.jpb).padStart(5)} (${String(c.jumps).padStart(3)}/${c.bars.toFixed(0).padStart(2)} v${c.viol.length} m${c.max.toFixed(3)} i${c.maxInt.toFixed(3)}/${c.p99Int.toFixed(4)}/${c.meanInt.toFixed(5)} ρ${c.swMed.toFixed(3)}/${c.swP90.toFixed(3)})`).join('  ')}`);
  }
  console.log('columns: ' + table[0].cells.map((c) => c.label).join(' | ') + (opt.places ? '   cell: P places dwelt ≥ 1 bar (bulb / baby / cardioid / EXT as one), per minute, visits, L distinct exterior landings [θ in 24ths per excursion], Q median loud/quiet (the track\'s ladder ≥ .6 / < .4), jumps per bar, viol, max step' : '   cell: jumps per bar (jumps/bars viol maxStep INT max/p99/mean step, ρ swing per beat med/p90)'));
  if (opt.out) fs.writeFileSync(opt.out, JSON.stringify(table, null, 1));
}
