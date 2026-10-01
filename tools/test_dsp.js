// Node test for assets/engine/ears/dsp.js — the streaming primitives the ears are built on.
// Today it is about ONE of them: `Quantile`, the Robbins-Monro quantile tracker (DECISIONS §73).
//
// THE BUG (§73). The update was
//     v += x > v ?  step * (1 - q)  :  -step * q
// At equilibrium the two pushes must balance: with p = P(x > v),
//     p * (1 - q) = (1 - p) * q   ->   p = q
// so `v` settled where q of the stream lies ABOVE it — the **(1 - q)** quantile. `Quantile(0.95)` on U(0,10)
// read 0.384, not 9.5. The correct Robbins-Monro weights are the other way round,
//     v += x > v ?  step * q  :  -step * (1 - q)
// which balances at p * q = (1 - p) * (1 - q) -> p = 1 - q: q of the stream lies BELOW `v`, the q-th quantile.
//
// The test has two halves: a CHARACTERISATION table (printed, the receipt — three known distributions, four q)
// and the assertions (convergence within 2 %, a step change tracked, and the monotonicity in q that is the
// sign's own guard: a q=0.9 tracker must sit ABOVE a q=0.5 one on the same stream, which is exactly what the
// old sign got backwards).
//   node tools/test_dsp.js
import { Quantile, RunMedian, clamp01, logmap } from '../assets/engine/ears/dsp.js';

let FAIL = 0;
const ok = (name, pass, value) => { if (!pass) FAIL++; console.log('  ' + (pass ? 'pass' : 'FAIL') + '  ' + name.padEnd(62) + value); };

// a deterministic LCG, so every number in DECISIONS §73 is reproducible
const mk = (seed) => { let s = seed >>> 0; return () => { s = (Math.imul(s, 1103515245) + 12345) & 0x7fffffff; return s / 0x7fffffff; }; };
const pct = (a, q) => { const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.max(0, Math.round(q * (s.length - 1))))]; };

// Read a stochastic tracker the honest way: the MEAN of `v` over the last fifth of the stream. A Robbins-Monro
// estimator never stops dithering by +-step, so the instantaneous `v` is not the estimate — its average is.
function settle(xs, q, step, mode) {
  const t = new Quantile(q, step, mode);
  const n0 = Math.floor(xs.length * 0.8);
  let s = 0, k = 0;
  for (let i = 0; i < xs.length; i++) { const v = t.push(xs[i]); if (i >= n0) { s += v; k++; } }
  return { mean: s / k, last: t.v };
}

const N = 200000;
// three distributions, each with its own true quantiles
const D = {
  'U(0,10)': (() => { const r = mk(12345); return Array.from({ length: N }, () => 10 * r()); })(),
  // a two-level signal: 80 % of the time a quiet 1.0, 20 % a loud 9.0, both with a little noise. p50 = 1, p90 = 9.
  'two-level': (() => { const r = mk(777); return Array.from({ length: N }, () => (r() < 0.8 ? 1 : 9) + 0.2 * (r() - 0.5)); })(),
  // a slow ramp 0 -> 10. NON-STATIONARY on purpose and its rows are INFORMATIONAL, not asserted: a monotone ramp
  // has no stationary quantile for a causal tracker to find. A low q is a floor follower that can only fall, so on
  // a rising stream it is dragged up to the top by the up-pushes alone and reads ~9 for q=0.1; a high q is a peak
  // follower and lands on the ramp's own head. That is the right behaviour for a running level and the reason the
  // engine's references are high-q, but it is not a quantile of the pooled samples and the table should say so.
  'ramp 0-10': Array.from({ length: N }, (_, i) => 10 * i / (N - 1)),
};
const QS = [0.1, 0.5, 0.9, 0.95];

console.log('Quantile characterisation (abs mode, step 0.02; `settled` = mean of v over the last 40k pushes)');
console.log('  ' + 'distribution'.padEnd(12) + '  q      true    settled   err');
const ERR = {};
for (const [name, xs] of Object.entries(D)) {
  for (const q of QS) {
    const truth = pct(xs, q), got = settle(xs, q, 0.02, 'abs').mean;
    const err = got - truth;
    ERR[name + '|' + q] = { truth, got, err };
    console.log('  ' + name.padEnd(12) + '  ' + q.toFixed(2) + '  ' + truth.toFixed(3).padStart(7) + '  '
      + got.toFixed(3).padStart(7) + '  ' + (err >= 0 ? '+' : '') + err.toFixed(3));
  }
}

console.log('the sign: v must RISE with q on one stream (the §73 bug had it fall)');
{
  const xs = D['U(0,10)'];
  const v = QS.map((q) => settle(xs, q, 0.02, 'abs').mean);
  ok('Quantile(0.1) < (0.5) < (0.9) < (0.95) on U(0,10)', v[0] < v[1] && v[1] < v[2] && v[2] < v[3],
    v.map((x) => x.toFixed(2)).join(' < '));
  // the bug's own signature, kept as a named guard: 0.95 must be the TOP of the stream, not the bottom
  ok('Quantile(0.95) is near 10, not near 0 (the §73 inversion)', v[3] > 8.5, v[3].toFixed(3));
}

console.log('convergence: within 2 % of the true quantile on U(0,10)');
for (const q of QS) {
  const e = ERR['U(0,10)|' + q];
  // 2 % of the DISTRIBUTION'S RANGE (0.2 on U(0,10)) — a tracker's error is set by its step and the local
  // density, not by the quantile's own magnitude, so a relative tolerance would be 10x tighter at q=0.1 than
  // at q=0.95 for no reason. The dither itself is +-step*max(q,1-q) = +-0.019.
  ok(`q=${q}: |settled - p${(100 * q).toFixed(0)}| <= 0.2 (2 % of the range)`, Math.abs(e.err) <= 0.2,
    `${e.got.toFixed(3)} vs ${e.truth.toFixed(3)} (${e.err >= 0 ? '+' : ''}${e.err.toFixed(3)})`);
}
{
  // the two-level signal is the engine's own case: a band that is quiet most of the time with loud hits in it.
  const e9 = ERR['two-level|0.9'], e5 = ERR['two-level|0.5'];
  ok('two-level: p90 lands on the LOUD level (9), not the quiet one', Math.abs(e9.err) <= 0.3, `${e9.got.toFixed(3)} vs ${e9.truth.toFixed(3)}`);
  ok('two-level: p50 lands on the QUIET level (1)', Math.abs(e5.err) <= 0.3, `${e5.got.toFixed(3)} vs ${e5.truth.toFixed(3)}`);
}

console.log('a step change: the tracker must follow it, and how fast is the step\'s own business');
{
  // U(0,10) for 100k pushes, then U(20,30). Record how many pushes after the step `v` first reads within
  // 0.5 of the new quantile, and where it sits 100k pushes later.
  const r = mk(4242);
  const q = 0.9, step = 0.02;
  const t = new Quantile(q, step, 'abs');
  for (let i = 0; i < 100000; i++) t.push(10 * r());
  const before = t.v;
  let hit = -1;
  for (let i = 0; i < 100000; i++) { const v = t.push(20 + 10 * r()); if (hit < 0 && Math.abs(v - 29) < 0.5) hit = i; }
  ok('q=0.9 sat at ~9 before the step', Math.abs(before - 9) < 0.5, before.toFixed(3));
  ok('q=0.9 reached ~29 after the step', Math.abs(t.v - 29) < 0.5, t.v.toFixed(3));
  // 20 dB to climb at step*q = 0.018 per push is ~1100 pushes at best; allow 4x that and no more.
  ok('... and got there inside 5000 pushes', hit >= 0 && hit < 5000, `${hit} pushes`);
}

console.log('rel mode: the step scales with |v|, so the same step is the same FRACTION per push');
{
  // a multiplicative stream (an RMS): U(0,10) and U(0,1000) must settle on the same RELATIVE quantile
  const r1 = mk(99), r2 = mk(99);
  const a = Array.from({ length: N }, () => 10 * r1()), b = Array.from({ length: N }, () => 1000 * r2());
  const va = settle(a, 0.9, 1e-3, 'rel').mean, vb = settle(b, 0.9, 1e-3, 'rel').mean;
  ok('p90 of U(0,10) and of U(0,1000) agree to 2 % after scaling', Math.abs(vb / 100 - va) / va < 0.02,
    `${va.toFixed(3)} vs ${(vb / 100).toFixed(3)}`);
}

console.log('determinism and the warm-up');
{
  const xs = D['U(0,10)'].slice(0, 5000);
  const a = settle(xs, 0.9, 0.02, 'abs').last, b = settle(xs, 0.9, 0.02, 'abs').last;
  ok('the same stream gives the same v, bit for bit', a === b, a.toFixed(6));
  const t = new Quantile(0.95, 0.02, 'abs');
  for (let i = 0; i < 16; i++) t.push(5);
  ok('the first 16 pushes are a running mean (no q weighting yet)', Math.abs(t.v - 5) < 1e-12, t.v.toFixed(6));
}

console.log('RunMedian (unchanged, here as the file\'s other primitive)');
{
  const m = new RunMedian(5);
  let v = 0; for (const x of [1, 100, 2, 3, 4, 5]) v = m.push(x);
  ok('a 5-window median rejects a single spike', v === 4, String(v));
  ok('clamp01 / logmap still bound to 0-1', clamp01(-1) === 0 && clamp01(2) === 1 && logmap(0.05, 0.05, 1) === 0 && logmap(1, 0.05, 1) === 1, 'ok');
}

console.log(FAIL ? `\n${FAIL} FAIL` : '\nall pass');
process.exit(FAIL ? 1 : 0);
