// Node test for assets/engine/drums (the reactive drums v2): the two rules the stage adds on top of its sources.
//   · synapse's hits are HELD until heard: 42.7 ms ahead (file det) -> released one 60 Hz frame later (the frame nearest
//     42.7 - SYN_DELAY = 11.7 ms); in capture (ahead < 0) at once; the levels keep synapse's peak and decay
//   · the kick = the ears' low onsets, strength = the flux's rank among the recent ones: the strongest reads 1 x the bass
//     factor, the weakest S0 x it; a louder bass section lifts every hit
//   node tools/test_drums.js
import { Drums, DRUMS } from '../assets/engine/drums/drums.js';

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
console.log(FAIL ? `test_drums: ${FAIL} FAILED` : 'test_drums: OK');
process.exit(FAIL ? 1 : 0);
