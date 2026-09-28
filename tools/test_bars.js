// Node test for assets/engine/bars (live step 3): the bar fingerprint store on a synthetic song, fed exactly as
// features-bars.js feeds it (one step() per 1/60 s frame, onsets placed on the grid by their ages).
//   · a 4-bar loop A B C D: from bar 6 on (one cycle, plus the two bars before a candidate its context needs — bar 0 has
//     none, so it cannot win bar 4's vote on context) every predicted step is the loop's own, released on the frame
//     nearest its line, and nothing else fires
//   · a change to E F E F: barNovelEvt on the first bar of it, predConf drops
//   · the loop comes back: barReturnEvt (and barNovelEvt) on its first bar
// Run twice: onsets delivered on the frame nearest them (file-det) and 52 ms after them (the capture path's reaction).
//   node tools/test_bars.js [--verbose]
import { Bars, STEPS, DIM } from '../assets/engine/bars/bars.js';

const V = process.argv.includes('--verbose');
let FAIL = 0;
const ok = (name, pass, value) => { if (!pass) FAIL++; console.log('  ' + (pass ? 'pass' : 'FAIL') + '  ' + name.padEnd(58) + value); };

const BPM = 128, FPS = 60, SPB = 60 / BPM;
// patterns as step lists (16ths); each bar also carries an energy vector (constant over the bar)
const P = (kick, snare, hat, e) => ({ kick, snare, hat, e });
const hat8 = [0, 2, 4, 6, 8, 10, 12, 14], hat16 = [...Array(16).keys()];
const A = P([0, 4, 8, 12], [4, 12], hat8, 0.6), B = P([0, 4, 8, 12], [4, 12], hat8, 0.62);
const C = P([0, 4, 8, 11, 12], [4, 12], hat8, 0.6), D = P([0, 4, 8, 12], [4, 12, 14, 15], hat16, 0.7);
const E = P([0, 6, 10], [8], [2, 6, 10, 14], 0.3), F = P([0, 6, 10], [8, 15], [2, 6, 10, 14], 0.32);
const song = [];
for (let r = 0; r < 6; r++) song.push(A, B, C, D);                       // bars 0-23
const CHANGE = song.length;
for (let r = 0; r < 4; r++) song.push(E, F);                             // bars 24-31
const RETURN = song.length;
for (let r = 0; r < 3; r++) song.push(A, B, C, D);                       // bars 32-43
const feat = (p) => { const f = new Float32Array(DIM); for (let d = 0; d < DIM; d++) f[d] = p.e * (0.5 + 0.5 * Math.sin(d + p.e * 7)); return f; };

function run(delay) {
  const bars = new Bars();
  // every onset: its beat position and class
  const on = [];
  song.forEach((p, k) => ['kick', 'snare', 'hat'].forEach((cls, c) => p[cls].forEach((s) => on.push({ c, x: 4 * k + s / 4 }))));
  on.sort((a, b) => a.x - b.x);
  const nF = Math.floor(song.length * 4 * SPB * FPS) - 2;
  const got = [], nov = [], ret = [], conf = [];
  let oi = 0;
  for (let f = 1; f <= nF; f++) {
    const t = f / FPS, B = t / SPB;
    const onsets = [];
    // an onset at time x·SPB is delivered on the frame nearest x·SPB + delay, placed by its age (exact)
    while (oi < on.length && on[oi].x * SPB + delay <= t + 0.5 / FPS) { onsets.push(on[oi]); oi++; }
    const k = Math.floor(B / 4);
    const o = bars.step({ B, rel: B, bpm: BPM, ok: true, anchor: -1, onsets, feat: feat(song[Math.min(k, song.length - 1)]), lead: 0.5 / FPS / SPB });
    for (const [c, fld] of [[0, 'predKickEvt'], [1, 'predSnareEvt'], [2, 'predHatEvt']]) if (o[fld]) got.push({ c, B, age: o[['predKickAge', 'predSnareAge', 'predHatAge'][c]], lvl: o[['predKick', 'predSnare', 'predHat'][c]] });
    if (o.barNovelEvt) nov.push(B);
    if (o.barReturnEvt) ret.push(B);
    conf.push({ B, v: o.predConf });
  }
  return { got, nov, ret, conf, on };
}

for (const [label, delay] of [['onsets on time (file-det)', 0], ['onsets 52 ms late (capture)', 0.052]]) {
  console.log(label);
  const R = run(delay);
  // 1. the loop: bars 6..23 predicted exactly
  const inBars = (x, k0, k1) => x >= 4 * k0 - 0.2 && x < 4 * k1 - 0.2;
  const truth = R.on.filter((e) => inBars(e.x, 6, CHANGE));
  const pred = R.got.filter((e) => inBars(e.B, 6, CHANGE));
  const key = (c, x) => c + ':' + Math.round(x * 4);
  const T = new Set(truth.map((e) => key(e.c, e.x))), Pd = new Set(pred.map((e) => key(e.c, e.B)));
  const miss = [...T].filter((x) => !Pd.has(x)), extra = [...Pd].filter((x) => !T.has(x));
  ok('loop bars 6-23: every step predicted, nothing else', !miss.length && !extra.length, `${pred.length} released · miss ${miss.length} extra ${extra.length}`);
  const off = pred.map((e) => Math.abs(e.B - Math.round(e.B * 4) / 4) * SPB * 1000);
  const ages = pred.map((e) => e.age), lv = pred.map((e) => e.lvl);
  ok('the age on the release frame is within half a frame of 0', Math.max(...ages.map(Math.abs)) <= 0.5 / FPS + 1e-9 && Math.min(...lv) > 0.94,
    `age ${(1000 * Math.min(...ages)).toFixed(2)}..${(1000 * Math.max(...ages)).toFixed(2)} ms · level >= ${Math.min(...lv).toFixed(3)}`);
  ok('released on the frame nearest the line', Math.max(...off) <= 1000 / FPS / 2 + 1e-6, `max |off| ${Math.max(...off).toFixed(2)} ms`);
  if (V) console.log('    miss', miss.slice(0, 8), 'extra', extra.slice(0, 8), '(class:global 16th; bar = step >> 4)');
  // 2. no section events inside the loop (after the first cycle)
  const falseNov = R.nov.filter((x) => x >= 16 && x < 4 * CHANGE);
  ok('no section event inside the loop', falseNov.length === 0, `${falseNov.length} (${falseNov.map((x) => x.toFixed(2)).join(' ')})`);
  // 3. the change: novel on its first bar
  const nc = R.nov.filter((x) => x >= 4 * CHANGE && x < 4 * CHANGE + 4);
  ok('change: barNovelEvt on its first bar', nc.length === 1, nc.length ? `+${(nc[0] - 4 * CHANGE).toFixed(2)} beats` : 'none');
  const nIn = R.nov.filter((x) => x >= 4 * CHANGE + 4 && x < 4 * RETURN);
  ok('no section event inside the new loop', nIn.length === 0, `${nIn.length} (${nIn.map((x) => (x / 4).toFixed(2)).join(' ')} bars)`);
  const cBefore = R.conf.filter((e) => e.B >= 4 * CHANGE - 8 && e.B < 4 * CHANGE).map((e) => e.v);
  const cAfter = R.conf.filter((e) => e.B >= 4 * CHANGE + 1.5 && e.B < 4 * CHANGE + 4).map((e) => e.v);
  const mean = (a) => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
  ok('change: predConf drops', mean(cAfter) < 0.6 * mean(cBefore), `${mean(cBefore).toFixed(2)} -> ${mean(cAfter).toFixed(2)}`);
  const cNew = R.conf.filter((e) => e.B >= 4 * (CHANGE + 4) && e.B < 4 * RETURN).map((e) => e.v);
  ok('change: confident again within 4 bars', mean(cNew) > 0.5, `${mean(cNew).toFixed(2)} over bars ${CHANGE + 4}-${RETURN - 1}`);
  // 4. the return
  const nr = R.nov.filter((x) => x >= 4 * RETURN && x < 4 * RETURN + 4), rr = R.ret.filter((x) => x >= 4 * RETURN && x < 4 * RETURN + 4);
  ok('return: barNovelEvt + barReturnEvt on its first bar', nr.length === 1 && rr.length === 1, rr.length ? `+${(rr[0] - 4 * RETURN).toFixed(2)} beats` : 'none');
  const falseRet = R.ret.filter((x) => !(x >= 4 * RETURN && x < 4 * RETURN + 4));
  ok('no other return', falseRet.length === 0, `${falseRet.length} (${falseRet.map((x) => (x / 4).toFixed(2)).join(' ')} bars)`);
  // 5. after the return the old continuation predicts at once: the return's second bar (B) predicted exactly
  const k2 = RETURN + 1;
  const t2 = new Set(R.on.filter((e) => inBars(e.x, k2, k2 + 3)).map((e) => key(e.c, e.x)));
  const p2 = new Set(R.got.filter((e) => inBars(e.B, k2, k2 + 3)).map((e) => key(e.c, e.B)));
  const m2 = [...t2].filter((x) => !p2.has(x)).length, e2 = [...p2].filter((x) => !t2.has(x)).length;
  ok('return: bars 2-4 of it predicted exactly', !m2 && !e2, `miss ${m2} extra ${e2}`);
}
// COLD START (the warm-up, docs/AUDIT-live-grid.md "Step 3 — warm-up"). The loop is entered mid-way (bar C first) on a clock
// that runs 8 % fast for 2 s, cuts to the right tempo, then pulls its phase in from -0.3 beat (tau 1 s) — the v3 clock from a
// cold start; the kicks sit +25 ms after their line (the causal kicks on SeeYouDrop). Onsets are placed by their (true) ages
// on the MOVING grid, as features-bars.js places them. INTRO: the same, after 6 bars of an intro whose only "kicks" are two
// pads a bar read 20 ms EARLY (the offset the intro teaches is wrong for the groove — SeeYouDrop's walk). Held to: nothing
// released while the clock is off by > 0.03 beat; the first 12 predicted kicks (of the groove) on time, |median| <= 6 ms
// (an EMA at 0.05 read -8 ms on the first case); the last 8 bars exact. A first sight of a bar (A, when only C was
// stored: they differ by one kick) may be guessed wrong, as the first groove bar may carry an intro kick — the thin
// history's honest limit: at most two, printed.
const PAD = P([2, 10], [], [], 0.2);
function coldRun(intro) {
  const bars = new Bars(), loop = [C, D, A, B], NI = intro ? 6 : 0, NB = 28 + NI, bps = BPM / 60, KOFF = 0.025;
  const barOf = (k) => (k < NI ? PAD : loop[(k - NI) % 4]);
  const on = [];
  for (let k = 0; k < NB; k++) ['kick', 'snare', 'hat'].forEach((cls, c) => barOf(k)[cls].forEach((st) =>
    on.push({ c, t: (4 * k + st / 4) / bps + (c ? 0 : k < NI ? -0.020 : KOFF), groove: k >= NI })));
  on.sort((x, y) => x.t - y.t);
  const err = (t) => (t < 2 ? 0.08 * bps * t : -0.3 * Math.exp(-(t - 2)));      // reported - true, beats
  const got = [];
  let oi = 0, early = 0;
  for (let f = 1; f <= Math.floor(NB * 4 / bps * FPS) - 2; f++) {
    const t = f / FPS, Brep = t * bps + err(t), bpm = t < 2 ? BPM * 1.08 : BPM;
    const onsets = [];
    while (oi < on.length && on[oi].t <= t + 0.5 / FPS) { onsets.push({ c: on[oi].c, x: Brep - (t - on[oi].t) * bpm / 60 }); oi++; }
    const k = Math.floor(t * bps / 4);
    const o = bars.step({ B: Brep, rel: Brep, bpm, ok: true, anchor: -1, onsets, feat: feat(barOf(k)), lead: 0.5 / FPS * bpm / 60, dt: 1 / FPS });
    for (const [c, fld] of [[0, 'predKickEvt'], [1, 'predSnareEvt'], [2, 'predHatEvt']]) if (o[fld]) {
      const near = on.filter((e) => e.c === c).reduce((a, e) => (Math.abs(e.t - t) < Math.abs(a.t - t) ? e : a), { t: 1e9 });
      got.push({ c, t, lag: t - near.t, groove: near.groove });
      if (Math.abs(err(t)) > 0.03) early++;
    }
  }
  const lo = (4 * (NB - 8)) / bps, hi = (4 * NB - 0.5) / bps, tol = 0.5 / FPS + 0.004;
  const last = on.filter((e) => e.t >= lo && e.t < hi);
  const hit = last.filter((e) => got.some((g) => g.c === e.c && Math.abs(g.t - e.t) <= tol)).length;
  const extra = got.filter((g) => g.t >= lo && g.t < hi && !last.some((e) => e.c === g.c && Math.abs(g.t - e.t) <= tol)).length;
  const k12 = got.filter((g) => g.c === 0 && g.groove && Math.abs(g.lag) < 0.05).slice(0, 12).map((g) => 1000 * g.lag).sort((x, y) => x - y);
  const wrong = got.filter((g) => Math.abs(g.lag) > 0.030);
  if (V) console.log('    wrong', wrong.map((e) => `${'KSH'[e.c]}@bar ${(e.t * bps / 4).toFixed(2)} ${(1000 * e.lag).toFixed(0)}ms`).join(' '), '· first 12 kicks', k12.map((x) => x.toFixed(0)).join(' '));
  return { got, early, last: last.length, hit, extra, kmed: k12.length ? k12[k12.length >> 1] : NaN, wrong, first: got.length ? got[0].t : null };
}
for (const [label, intro] of [['cold start (mid-loop, a tempo cut at 2 s, phase pulled in from -0.3 beat, kicks +25 ms)', false],
  ['cold start after a 6-bar intro (its pads read as kicks 20 ms early)', true]]) {
  console.log(label);
  const R = coldRun(intro);
  ok('nothing released while the clock is off by > 0.03 beat', R.early === 0, `${R.early} of ${R.got.length} · first release at ${R.first === null ? '-' : R.first.toFixed(1) + ' s'}`);
  ok('the first 12 predicted groove kicks on time (|median| <= 6 ms)', Math.abs(R.kmed) <= 6, `median ${R.kmed.toFixed(1)} ms`);
  ok('the last 8 bars exact', R.hit === R.last && R.extra === 0, `${R.hit}/${R.last} · extra ${R.extra}`);
  ok('at most two first-sight guesses wrong (> 30 ms off)', R.wrong.length <= 2, `${R.wrong.length} (${R.wrong.map((e) => 'bar ' + (e.t * BPM / 240).toFixed(2)).join(' ')})`);
}
// degrade: ok false -> nothing released, conf 0
{
  const bars = new Bars();
  let n = 0, c = 0;
  for (let f = 1; f < 60 * 20; f++) {
    const B = f / FPS / SPB, k = Math.floor(B / 4), p = song[k % 4];
    const onsets = [];
    for (const [ci, cls] of [[0, 'kick'], [1, 'snare'], [2, 'hat']]) for (const s of p[cls]) { const x = 4 * k + s / 4; if (x > (f - 1) / FPS / SPB && x <= B) onsets.push({ c: ci, x }); }
    const o = bars.step({ B, rel: B, bpm: BPM, ok: false, anchor: -1, onsets, feat: feat(p), lead: 0.5 / FPS / SPB });
    n += o.predKickEvt + o.predSnareEvt + o.predHatEvt + o.barNovelEvt; c = Math.max(c, o.predConf);
  }
  console.log('degrade');
  ok('grid not ok: no predicted events, predConf 0', n === 0 && c === 0, `${n} events, max conf ${c}`);
}
console.log(FAIL ? `test_bars: ${FAIL} FAILED` : 'test_bars: OK');
process.exit(FAIL ? 1 : 0);
