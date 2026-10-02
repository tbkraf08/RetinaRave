// `modeShade` (assets/engine/ears/shade.js, DECISIONS §82): the chord quality of the bass's degree in the key.
//   node tools/test_shade.js
// Cases: (1) the table: SeeYouDrop's walk C# A F# E in C# minor is i VI iv III = -1 +1 -1 +1, and reads the SAME under
// the relative major (E) and under the keys the ears actually wander to on that walk (F# minor, A major); Vienna's
// D# / A# / F# in D# minor are i / v / III = -1 / -1 / +1; a chromatic bass is 0; (2) the 808 glide (F# E D# C# in 50 ms)
// does not count — the note has to hold 60 ms; (3) no bass and no key -> the field eases to 0 within a bar; (4) the
// sub's note outranks the bass chroma's root, and the chroma root stands in at 0.6 when the sub is gated off;
// (5) synapse's key counts by keycolour's ramp when the ears have no tonic; (6) a (key, mode) must hold 2 s before the
// degree is taken against it (the parallel-mode flips on SeeYouDrop's walk are 0.35 / 0.67 s).
import { SHADEK, ModeShade, degreeShade } from '../assets/engine/ears/shade.js';

let fails = 0;
const ok = (name, cond, detail = '') => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); if (!cond) fails++; };
const N = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
const walk = ['C#', 'A', 'F#', 'E'].map((n) => N[n]);
const shades = (key, minor) => walk.map((n) => degreeShade(n, key, minor));
// (1)
ok('SeeYouDrop\'s walk in C# minor reads i VI iv III = -1 +1 -1 +1', shades(N['C#'], 1).join() === '-1,1,-1,1', shades(N['C#'], 1).join());
ok('… the same under the relative major, E', shades(N.E, 0).join() === '-1,1,-1,1', shades(N.E, 0).join());
ok('… the same under F# minor (the ears\' read at 19-25 s)', shades(N['F#'], 1).join() === '-1,1,-1,1', shades(N['F#'], 1).join());
ok('… the same under A major (the ears\' read at 18-19 s)', shades(N.A, 0).join() === '-1,1,-1,1', shades(N.A, 0).join());
ok('Vienna: D# / A# / F# in D# minor = i / v / III = -1 / -1 / +1', [N['D#'], N['A#'], N['F#']].map((n) => degreeShade(n, N['D#'], 1)).join() === '-1,-1,1');
ok('a chromatic bass (D in C# minor, the raised 7th B# too) is 0', degreeShade(N.D, N['C#'], 1) === 0 && degreeShade(N.C, N['C#'], 1) === 0);
ok('the major table: I IV V major, ii iii vi minor, vii dim -1', SHADEK.MAJ.join() === '1,0,-1,0,-1,1,0,1,0,-1,0,-1');
// a frame driver
const S = (o) => Object.assign({ key: N['C#'], mode: 1, tonic: N['C#'], keyConf: 0.6, subNote: -1, subGate: 0, subConf: 0, bchroma: null, bpm: 150 }, o);
const DT = 1 / 60, BAR = 240 / 150;
// (2) the glide
{
  const m = new ModeShade();
  for (const n of ['F#', 'E', 'D#']) m.step(DT, S({ subNote: N[n], subGate: 1, subConf: 0.7 }));   // 50 ms of glide at conf 0.7
  ok('through the 808 glide the target is still unknown', m.src === 0 && Math.abs(m.v) < 1e-9, `v ${m.v.toFixed(4)} src ${m.src}`);
  let v = 0; for (let i = 0; i < 120; i++) v = m.step(DT, S({ subNote: N['C#'], subGate: 1, subConf: 1 }));
  ok('C# held 2 s in C# minor: i -> -1 (settled within a bar)', v < -0.95 && m.src === 1 && m.deg === -1, `v ${v.toFixed(3)}`);
  for (let i = 0; i < Math.round(BAR / DT); i++) v = m.step(DT, S({ subNote: N.A, subGate: 1, subConf: 1 }));
  ok('A for one bar: VI -> past +0.85 by the bar line (three time constants from -1, less the 60 ms hold)', v > 0.85, `v ${v.toFixed(3)}`);
}
// (3) unknown -> 0
{
  const m = new ModeShade(); let v = 0;
  for (let i = 0; i < 60; i++) v = m.step(DT, S({ subNote: N['C#'], subGate: 1, subConf: 1 }));
  for (let i = 0; i < Math.round(BAR / DT); i++) v = m.step(DT, S({}));
  ok('the sub leaves: back within 0.06 of 0 after a bar', Math.abs(v) < 0.06, `v ${v.toFixed(3)}`);
  const m2 = new ModeShade(); let v2 = 0;
  for (let i = 0; i < 60; i++) v2 = m2.step(DT, S({ subNote: N.A, subGate: 1, subConf: 1, tonic: -1, keyConf: 0.05 }));
  ok('no tonic and keyConf under the ramp: 0 exactly', v2 === 0, `v ${v2}`);
}
// (4) the chroma fallback
{
  const bc = new Float32Array(12); bc.fill(0.03); bc[N.A] = 0.5;      // A dominates: 0.5 / 0.83 = 60 %
  const m = new ModeShade(); let v = 0;
  for (let i = 0; i < 120; i++) v = m.step(DT, S({ bchroma: bc }));
  ok('sub gated off, A dominates the bass chroma: VI at the fallback weight 0.6', m.src === 2 && Math.abs(v - 0.6) < 0.02, `v ${v.toFixed(3)} src ${m.src}`);
  for (let i = 0; i < 120; i++) v = m.step(DT, S({ bchroma: bc, subNote: N['C#'], subGate: 1, subConf: 1 }));
  ok('the sub comes back on C#: it outranks the chroma, i at weight 1', m.src === 1 && v < -0.95, `v ${v.toFixed(3)}`);
  const flat = new Float32Array(12).fill(0.1);
  const m3 = new ModeShade(); let v3 = 0; for (let i = 0; i < 60; i++) v3 = m3.step(DT, S({ bchroma: flat }));
  ok('a flat bass chroma names no root: 0', v3 === 0 && m3.src === 0);
}
// (6) the key hold: a 0.5 s flip of the MODE (C# minor -> C# major, the parallel-mode coin toss) leaves the C# bar at i;
// a modulation that holds 2 s is adopted
{
  const m = new ModeShade(); let v = 0;
  for (let i = 0; i < 120; i++) v = m.step(DT, S({ subNote: N['C#'], subGate: 1, subConf: 1 }));
  for (let i = 0; i < 30; i++) v = m.step(DT, S({ subNote: N['C#'], subGate: 1, subConf: 1, mode: 0 }));   // 0.5 s of "C# major"
  ok('a 0.5 s parallel-mode flip does not move the tonic bar off i', v < -0.95 && m.minor === 1, `v ${v.toFixed(3)}`);
  for (let i = 0; i < 150; i++) v = m.step(DT, S({ subNote: N['C#'], subGate: 1, subConf: 1, mode: 0 }));   // 2.5 s more: adopted
  ok('held 2 s, the new mode is adopted: C# is I, +1', v > 0.5 && m.minor === 0, `v ${v.toFixed(3)}`);
}
// (5) synapse's key by the ramp
{
  const m = new ModeShade(); let v = 0;
  for (let i = 0; i < 120; i++) v = m.step(DT, S({ subNote: N.A, subGate: 1, subConf: 1, tonic: -1, keyConf: 0.2 }));
  ok('no tonic, keyConf 0.2 (half the ramp): VI at +0.5', Math.abs(v - 0.5) < 0.02, `v ${v.toFixed(3)}`);
}
console.log(fails ? `${fails} FAIL` : 'all ok');
process.exit(fails ? 1 : 0);
