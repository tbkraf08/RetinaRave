// Node test for assets/engine/drums (the reactive drums v2): the two rules the stage adds on top of its sources.
//   · synapse's hits are HELD until heard: 42.7 ms ahead (file det) -> released one 60 Hz frame later (the frame nearest
//     42.7 - SYN_DELAY = 11.7 ms); in capture (ahead < 0) at once; the levels keep synapse's peak and decay
//   · the kick = the ears' low onsets, strength = the rise's rank among the recent ones: the strongest reads 1 x the bass
//     factor, the weakest S0 x it; a louder bass section lifts every hit
// Plus (DECISIONS §68) the SOURCE of that kick — the ears' LOW lane — on a synthetic masked kick, because that is the
// one case the real tracks could not isolate: a continuous sub drone with a soft thud above it. No PCM file needed.
//   node tools/test_drums.js
import { Drums, DRUMS } from '../assets/engine/drums/drums.js';
import { Ears } from '../assets/engine/ears/ears.js';

let FAIL = 0;
const ok = (name, pass, value) => { if (!pass) FAIL++; console.log('  ' + (pass ? 'pass' : 'FAIL') + '  ' + name.padEnd(62) + value); };
const dt = 1 / 60;
const syn = () => ({ kick: 0, snare: 0, hat: 0 });

console.log('hold');
for (const [ahead, want, label] of [[0.0427, 1, 'file det (42.7 ms ahead)'], [-0.027, 0, 'capture (27 ms behind)']]) {
  const d = new Drums(), A = syn();
  let at = -1;
  for (let f = 0; f < 10; f++) {
    A.snare *= Math.exp(-dt / 0.13);
    if (f === 3) A.snare = 0.8;                           // synapse finds a snare on frame 3
    const o = d.step({ syn: A, bassN: 0.5, low: 0, lowFl: 0, ahead, dt });
    if (at < 0 && o.snare2 > 0.5) at = f;
  }
  ok(`${label}: snare2 released ${want} frame(s) after synapse's`, at === 3 + want, `frame ${at}`);
}
{
  const d = new Drums(), A = syn();
  const v = [];
  for (let f = 0; f < 12; f++) { A.snare *= Math.exp(-dt / 0.13); if (f === 0) A.snare = 0.8; v.push(d.step({ syn: A, bassN: 0.5, low: 0, lowFl: 0, ahead: 0, dt }).snare2); }
  ok('no hold: snare2 = synapse\'s snare, frame by frame', v.every((x, f) => Math.abs(x - 0.8 * Math.exp(-f * dt / 0.13)) < 1e-6), `peak ${v[0].toFixed(3)}`);
}
console.log('kick strength');
{
  const d = new Drums(), A = syn(), pk = [];
  const fl = [2, 4, 6, 8, 3, 5, 7, 9, 5, 5, 5, 5, 10, 1];   // low onsets, one every 20 frames
  for (let f = 0; f < fl.length * 20; f++) {
    const hit = f % 20 === 0;
    const o = d.step({ syn: A, bassN: 1, low: hit ? 1 : 0, lowFl: hit ? fl[f / 20] : 0, ahead: 0, dt });
    if (hit) pk.push(o.kick2);
  }
  ok('a cold start: the first hit reads the middle, not the top', pk[0] > 0.2 && pk[0] < 0.6, pk.slice(0, 4).map((x) => x.toFixed(2)).join(' '));
  ok('once warm the loudest reads 1 x the bass factor, the quietest S0', Math.abs(pk[12] - 1) < 1e-6 && Math.abs(pk[13] - DRUMS.S0) < 1e-6, `${pk[12].toFixed(3)} ${pk[13].toFixed(3)}`);
  ok('a middling hit reads between S0 and 1, on the curve', pk[9] > DRUMS.S0 && pk[9] < 0.7, pk.map((x) => x.toFixed(2)).join(' '));
  const d2 = new Drums(), q = [];
  for (const b of [0, 1]) for (let f = 0; f < 40; f++) { const hit = f % 20 === 0; const o = d2.step({ syn: A, bassN: b, low: hit ? 1 : 0, lowFl: 5, ahead: 0, dt }); if (hit) q.push(o.kick2); }
  ok('the same hit is stronger in a louder bass section', q[3] > q[1] * 1.5, `${q[1].toFixed(2)} -> ${q[3].toFixed(2)}`);
}
// ---------------------------------------------------------------------------------------------------------------
// §68 THE LOW LANE under a sub drone. 20 bars at 120 BPM, 48 kHz: a continuous D#1 (38.89 Hz, the note Vienna's 808
// holds) at 0.40 with NO pulse at all, and a thud on beats 1 and 3 — a 95 Hz sine decaying over 30 ms at 0.18, with
// a 4 kHz beater click at 0.3x so the `kick` class fires too. The geometry IS the Vienna failure, in its purest
// form: a 4th-order high-pass at 40 Hz passes a 38.89 Hz drone at -3 dB, so in a 40-150 Hz band this kick is only
// +0.9 dB over the drone — under the old lane's own 1.2 dB flux floor — while in 60-150 Hz the drone is 15 dB down
// and the same kick is +9 dB. Measured both ways in this file's own harness (`git show HEAD~:…/perc.js`, §68):
//   the 40-150 Hz flux lane   low n 39  P 0.87  R 0.87   lag p50 +12.7  p90 +23.3 ms
//   the 60-150 Hz rise lane   low n 39  P 1.00  R 1.00   lag p50  +1.3  p90 +12.0 ms
// The first kick is inside the lane's own 85 ms baseline warm-up, so the reference is kicks 2..40.
console.log('the low lane under a sub drone (§68)');
{
  const SR = 48000, BEAT = 0.5, BARS = 20, DUR = BARS * 4 * BEAT, N = Math.round(DUR * SR);
  const kicks = [];
  for (let bar = 0; bar < BARS; bar++) for (const b of [0, 2]) kicks.push((bar * 4 + b) * BEAT);
  const L = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    let x = 0.40 * Math.sin(2 * Math.PI * 38.89 * t);              // the drone: continuous, no pulse
    for (const k of kicks) {
      const d = t - k;
      if (d >= 0 && d < 0.25) {
        x += 0.18 * Math.exp(-d / 0.030) * Math.sin(2 * Math.PI * 95 * d);          // the masked thud
        x += 0.054 * Math.exp(-d / 0.004) * Math.sin(2 * Math.PI * 4000 * d);       // its beater click
      }
    }
    L[i] = x;
  }
  const ears = new Ears(SR), B = 512, bl = new Float32Array(B);
  const low = [], kick = [], vel = [], den = [];
  let next = 0;
  for (let s = 0; s + B <= N; s += B) {
    bl.set(L.subarray(s, s + B)); ears.push(bl, bl, s / SR);
    const tEnd = (s + B) / SR;
    while (next <= tEnd) {
      const o = ears.read(next);
      for (const e of ears.lowReleased) low.push(e.t);
      for (const e of ears.events) if (e.type === 'kick') { kick.push(e.t); vel.push(o.kickVel); den.push(o.denK); }
      next += 1 / 60;
    }
  }
  const ref = kicks.slice(1);
  const grade = (det) => {
    const used = new Array(ref.length).fill(false); let tp = 0; const lag = [];
    for (const d of det) {
      let j = -1, best = 0.031;
      for (let i = 0; i < ref.length; i++) { if (used[i]) continue; const e = Math.abs(d - ref[i]); if (e <= 0.030 && e < best) { best = e; j = i; } }
      if (j >= 0) { used[j] = true; tp++; lag.push(d - ref[j]); }
    }
    lag.sort((a, b) => a - b);
    return { n: det.length, P: tp / Math.max(1, det.length), R: tp / ref.length,
      p50: 1000 * (lag[lag.length >> 1] || 0), p90: 1000 * (lag[Math.floor(0.9 * lag.length)] || 0) };
  };
  const gl = grade(low), gk = grade(kick);
  ok('the low lane finds every masked kick (P >= 0.95)', gl.P >= 0.95 && gl.R >= 0.95,
    `n ${gl.n}/${ref.length}  P ${gl.P.toFixed(3)}  R ${gl.R.toFixed(3)}`);
  ok('... on time (median lag <= 10 ms, no fire before the thud)', Math.abs(gl.p50) <= 10 && gl.p50 > -10,
    `p50 ${gl.p50.toFixed(1)} ms, p90 ${gl.p90.toFixed(1)} ms`);
  ok('... and never twice for one thud (the 85 ms refractory)', gl.n <= ref.length + 1, `${gl.n} fires for ${ref.length} kicks`);
  ok('kickEvt follows the same lane (the beater confirms every one)', gk.P >= 0.95 && gk.R >= 0.95 && Math.abs(gk.p50) <= 10,
    `n ${gk.n}/${ref.length}  P ${gk.P.toFixed(3)}  R ${gk.R.toFixed(3)}  p50 ${gk.p50.toFixed(1)} ms`);
  ok('kickVel is a share of the lane\'s own p95, not a constant', vel.length > 8 && Math.min(...vel) < Math.max(...vel) && Math.max(...vel) <= 1,
    `min ${Math.min(...vel).toFixed(3)} max ${Math.max(...vel).toFixed(3)}`);
  ok('denK counts the lane\'s hits in the last second (2 kicks/s here)', den.length > 8 && Math.abs(den[den.length - 1] - 2) <= 1,
    `last ${den[den.length - 1]} /s`);
}

console.log(FAIL ? `test_drums: ${FAIL} FAILED` : 'test_drums: OK');
process.exit(FAIL ? 1 : 0);
