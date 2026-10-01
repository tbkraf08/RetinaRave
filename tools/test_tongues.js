// Node test of the Arnold tongues (assets/engine/clock/tongues.js, DECISIONS §76) on synthetic click trains fed straight into
// Tongues.hop() — the band flux per 512-sample hop, an exact clock (b advances bps·dt, no re-seats) at 120 BPM, 40 s a case,
// the per-beat outputs graded as medians over the full windows after the first ten:
//   1:1      a click on every beat: the Ω = 1 oscillator locks (d₁:₁ > 0.9, the probe's "d → 1"), the 1:1 tongue is K/π wide
//            within one bank step (K 1: 0.46 oct), tongueK reads 1, tongueAmbig ~ 0, tongueLat ~ 0 at full confidence
//   2:1      a click on every 8th: the 2:1 tongue is the DEEPEST of the ladder and 1:1 is shallow (the probe's finding on the
//            real tracks: the denser lattice wins by depth)
//   accent   8ths 2.46 dB below the quarters (0.753 x): d₁:₁ − d₂:₁ rises with K; at the engine's K 1 the 2:1 is still the
//            deeper (the circle map prefers the denser train — §61's `alive` decides the octave, not the bank), at K 2 the 1:1
//   swing    a straight train reads swing 1.00; the off-8th at 0.6 of the beat reads 1.5 ± 0.1 (the histogram's 1/64 bin)
//   silence  no drive: every depth 0, tongueAmbig 1, swing 1
//   re-seat  a jump of the beat position clears the windows (tongueOn 0) and they refill WIN beats later
//   determinism  two runs are identical to the last bit
//   node tools/test_tongues.js
import { Tongues, TONGUEK, TONGUE_FIELDS } from '../assets/engine/clock/tongues.js';

let FAIL = 0;
const ok = (name, pass, value) => { if (!pass) FAIL++; console.log('  ' + (pass ? 'pass' : 'FAIL') + '  ' + name.padEnd(78) + value); };
const SR = 48000, HOP = 512, dt = HOP / SR, BPM = 120, bps = BPM / 60;
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[s.length >> 1] : NaN; };
const f3 = (x) => (+x).toFixed(3);

// pattern(frac) -> the click's amplitude at this beat phase (within half a hop of its line), or 0
function run(secs, K, pattern, opts = {}) {
  const tg = new Tongues(Object.assign({}, TONGUEK, { K }));
  let b = 0, last = -1;
  const rows = [], w = bps * dt / 2;
  const near = (fr, x) => Math.abs((((fr - x + 0.5) % 1) + 1) % 1 - 0.5) < w;
  for (let h = 0; h < secs / dt; h++) {
    const t = (h + 1) * dt;
    b += bps * dt;
    if (opts.jumpAt !== undefined && Math.abs(t - opts.jumpAt) < dt / 2) b += 0.5;
    const fr = b - Math.floor(b);
    let amp = 0;
    for (const [x, a] of pattern) if (near(fr, x)) amp = a;
    if (opts.silent) amp = 0;
    tg.hop(t, amp, amp, bps, b);
    if (tg.beats !== last) { last = tg.beats; rows.push({ t, on: tg.out.tongueOn, w11: tg.w11, ...tg.out }); }
  }
  return { rows, tg };
}
const graded = (rows) => rows.filter((r) => r.on === 1).slice(10);
const M = (rows, k) => med(graded(rows).map((r) => r[k]));

console.log('1:1 — a click on every beat (K 1)');
{
  const { rows } = run(40, 1, [[0, 1]]);
  const g = graded(rows);
  ok('the windows fill and run', g.length > 40, `${g.length} full windows`);
  ok('d 1:1 > 0.9 (the probe: a click train at Ω = 1 gives d → 1)', M(rows, 'tongue11') > 0.9, `d11 ${f3(M(rows, 'tongue11'))} d21 ${f3(M(rows, 'tongue21'))} d41 ${f3(M(rows, 'tongue41'))}`);
  const wTheory = Math.log2((1 + 1 / (2 * Math.PI)) / (1 - 1 / (2 * Math.PI)));   // the sine map locks 1:1 on Ω ∈ 1 ± K/2π
  ok('the 1:1 tongue is K/π wide (Ω 1 ± K/2π) within one bank step', Math.abs(M(rows, 'w11') - wTheory) <= TONGUEK.OCT_STEP + 1e-9, `w11 ${f3(M(rows, 'w11'))} oct (theory ${f3(wTheory)})`);
  ok('tongueK reads 1 (a clean click train), tongueAmbig under 0.1', M(rows, 'tongueK') >= 0.99 && M(rows, 'tongueAmbig') < 0.1, `K ${f3(M(rows, 'tongueK'))} ambig ${f3(M(rows, 'tongueAmbig'))}`);
  ok('tongueLat within 0.05 cycle of the line at confidence > 0.9', Math.abs(M(rows, 'tongueLat')) < 0.05 && M(rows, 'tongueLatConf') > 0.9, `lat ${f3(M(rows, 'tongueLat'))} conf ${f3(M(rows, 'tongueLatConf'))}`);
  ok('swing 1.00 on a straight train', Math.abs(M(rows, 'swing') - 1) < 0.02, `swing ${f3(M(rows, 'swing'))}`);
}
console.log('2:1 — a click on every 8th (K 1)');
{
  const { rows } = run(40, 1, [[0, 1], [0.5, 1]]);
  const d11 = M(rows, 'tongue11'), d21 = M(rows, 'tongue21'), d41 = M(rows, 'tongue41');
  ok('the 2:1 tongue is the deepest of the ladder (> 0.9) and 1:1 is shallow (< 0.4)', d21 > 0.9 && d21 > d11 && d21 > d41 && d11 < 0.4, `d11 ${f3(d11)} d21 ${f3(d21)} d41 ${f3(d41)}`);
  ok('swing 1.00 on straight 8ths', Math.abs(M(rows, 'swing') - 1) < 0.02, `swing ${f3(M(rows, 'swing'))}`);
}
console.log('accent — 8ths 2.46 dB below the quarters, K 0.5 / 1 / 2');
{
  const a = Math.pow(10, -2.46 / 20), diff = [];
  for (const K of [0.5, 1, 2]) { const { rows } = run(40, K, [[0, 1], [0.5, a]]); diff.push([K, M(rows, 'tongue11'), M(rows, 'tongue21')]); }
  const txt = diff.map(([K, x, y]) => `K ${K}: d11 ${f3(x)} d21 ${f3(y)}`).join(' · ');
  ok('d 1:1 − d 2:1 rises with K', diff[0][1] - diff[0][2] < diff[1][1] - diff[1][2] && diff[1][1] - diff[1][2] < diff[2][1] - diff[2][2], txt);
  ok('at the engine\'s K 1 the denser train is still the deeper (the five-track finding; the octave is §61\'s)', diff[1][2] > diff[1][1], '');
  ok('at K 2 the accented beat wins by depth', diff[2][1] > diff[2][2], '');
}
console.log('swing — the off-8th at 0.6 of the beat (ratio 1.5)');
{
  const { rows } = run(40, 1, [[0, 1], [0.6, 0.8]]);
  ok('swing 1.5 ± 0.1', Math.abs(M(rows, 'swing') - 1.5) < 0.1, `swing ${f3(M(rows, 'swing'))}`);
}
console.log('silence');
{
  const { rows } = run(30, 1, [[0, 1]], { silent: true });
  ok('every depth 0, tongueAmbig 1, swing 1', M(rows, 'tongue11') === 0 && M(rows, 'tongue21') === 0 && M(rows, 'tongueAmbig') === 1 && M(rows, 'swing') === 1, `d11 ${f3(M(rows, 'tongue11'))} ambig ${f3(M(rows, 'tongueAmbig'))} swing ${f3(M(rows, 'swing'))}`);
}
console.log('re-seat');
{
  const { rows } = run(40, 1, [[0, 1]], { jumpAt: 20 });
  const before = rows.filter((r) => r.t < 20).slice(-3), after = rows.filter((r) => r.t > 20);
  const off = after.findIndex((r) => r.on === 0), back = after.findIndex((r, i) => i > off && r.on === 1);
  ok('running before the jump, the windows cleared at it, running again WIN beats later', before.every((r) => r.on === 1) && off === 0 && back >= TONGUEK.WIN - 1 && back <= TONGUEK.WIN + 1, `cleared at beat +${off}, back at +${back} (WIN ${TONGUEK.WIN})`);
}
console.log('determinism');
{
  const A = run(30, 1, [[0, 1], [0.5, 0.6]]).rows, B = run(30, 1, [[0, 1], [0.5, 0.6]]).rows;
  ok('two runs are identical to the last bit', JSON.stringify(A) === JSON.stringify(B), `${A.length} beats`);
  ok('every field published', TONGUE_FIELDS.every((k) => k in A[A.length - 1]), TONGUE_FIELDS.length + ' fields');
}
console.log(FAIL ? `FAIL ${FAIL}` : 'OK');
process.exit(FAIL ? 1 : 0);
