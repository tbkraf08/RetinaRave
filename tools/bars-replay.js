// Run the bar fingerprint store (assets/engine/bars) on a RECORDED trace — seconds instead of a 2.5 min page run — and
// write a trace predcheck.py grades. The input trace must be a deterministic file trace with the lead OFF and the map OFF
// (so its clocks are the raw ones the stage sees and its onsets the causal ears'), carrying bars/feed.js FEED_IN:
//   F=$(node tools/bars-replay.js --fields)
//   PORT=8851 node tools/filetrace.js SeeYouDrop 0 157.4 tools/work/in-syd.json "$F" '&map=0&lead=0'
//   node tools/bars-replay.js tools/work/in-syd.json tools/work/out-syd.json [--set NOV_SIM=0.6,...]
//   python3 tools/truth/predcheck.py tools/work/out-syd.json
// The replay's audio lead is the trace's -detLead (file-det; what LEAD.L reads there), dt 1/fps. Identity with the page:
// a page trace of the pred fields under '&map=0' equals the replay's (the check at the end of HARNESS.md "Bars").
// Warm-up (live step 3, 2026-09-28): --from <heard s> starts the store COLD there on the trace's warm clocks (the store's
// own warm-up, apart from the clocks'); --diag <out.json> writes one row per stored bar (the offsets, reliability, phase).
import fs from 'node:fs';
import * as M from '../assets/engine/bars/bars.js';
import { feed, FEED_IN } from '../assets/engine/bars/feed.js';

const a = process.argv.slice(2);
if (a[0] === '--fields') { console.log(['heardT', 'leadT', ...FEED_IN].join(',')); process.exit(0); }
const opt = (k) => (a.includes(k) ? a.splice(a.indexOf(k), 2)[1] : null);
const FROM = opt('--from'), DIAG = opt('--diag');
const SET = opt('--set');                  // --set SLIP_SET=0.08,REL_N0=2: the warm-up's knobs (bars.js WARM)
if (SET) for (const kv of SET.split(',')) { const [k, v] = kv.split('='); if (!(k in M.WARM)) { console.error('bars-replay: no WARM.' + k); process.exit(2); } M.WARM[k] = +v; }
const [inp, out] = a;
if (!inp || !out) { console.error('usage: node tools/bars-replay.js <in.json> <out.json> | --fields'); process.exit(2); }
const tr = JSON.parse(fs.readFileSync(inp, 'utf8'));
if (tr.mode !== 'file-det') console.warn('bars-replay: mode ' + tr.mode + ' — only a file-det trace has a known audio lead');
const miss = FEED_IN.filter((k) => !(k in tr.cols));
if (miss.length) { console.error('bars-replay: the trace lacks ' + miss.join(', ')); process.exit(2); }
if (tr.cols.leadT && tr.cols.leadT.some((v) => v)) console.warn('bars-replay: leadT is not 0 — record with &lead=0 (the clocks must be raw)');
const bars = new M.Bars(), L = -(tr.detLead || 0.0427), dt = 1 / (tr.fps || 60), S = {}, into = {};
const OUT = M.BARS_OUT, cols = Object.fromEntries(OUT.map((k) => [k, []]));
let cpu = 0, worst = 0;
const i0 = FROM === null ? 0 : Math.max(0, tr.t.findIndex((x) => x >= +FROM)), diag = [];
let seq = 0, a0 = bars.a;
for (let i = i0; i < tr.t.length; i++) {
  for (const k of FEED_IN) { const v = tr.cols[k][i]; S[k] = v === null ? NaN : v; }
  const c0 = performance.now();
  const o = bars.step(feed(S, L, 0, dt, into));
  const c = performance.now() - c0; cpu += c; if (c > worst) worst = c;
  for (const k of OUT) cols[k].push(typeof o[k] === 'number' ? +o[k].toFixed(4) : o[k] ? 1 : 0);
  if (DIAG && (bars.seq !== seq || bars.a !== a0)) {
    diag.push({ t: tr.t[i], seq: bars.seq, k: bars.lastK, a: bars.a, moved: bars.a !== a0, off: [...bars.off].map((x) => +x.toFixed(3)),
      rel: +bars.rel.toFixed(3), relN: bars.relN, conf: +bars.conf.toFixed(3), match: +bars.match.toFixed(3), ok: bars.seq ? bars.okS[(bars.seq - 1) % M.NBAR] : 0, set: bars.settled ? 1 : 0 });
    seq = bars.seq; a0 = bars.a;
  }
}
if (DIAG) fs.writeFileSync(DIAG, JSON.stringify(diag));
const keep = ['leadT', 'kickEvt', 'kickAge', 'snareEvt', 'snareAge', 'hatEvt', 'hatAge'];
const sl = (x) => x.slice(i0);
const res = { track: tr.track, mode: tr.mode, sr: tr.sr, at: tr.at, fps: tr.fps, detLead: tr.detLead, t: sl(tr.t), f: sl(tr.f), log: [],
  fields: [...keep, ...OUT], cols: Object.assign(Object.fromEntries(keep.filter((k) => k in tr.cols).map((k) => [k, sl(tr.cols[k])])), cols) };
res.cols.leadT = res.t.map(() => L);
fs.writeFileSync(out, JSON.stringify(res));
console.log(`${out}: ${tr.t.length - i0} frames · bars stored ${bars.seq} · ${(1000 * cpu / (tr.t.length - i0)).toFixed(1)} µs/frame mean, worst ${worst.toFixed(2)} ms`);
