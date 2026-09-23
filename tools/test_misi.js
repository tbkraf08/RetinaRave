// Tuned Misiurewicz points are strictly preperiodic under f_c itself.
import { BABIES, MISI } from '../assets/math/baby.js';
let bad = 0;
for (const B of BABIES) {
  console.log('P', B.P, 'misi found', B.misi.filter(Boolean).length, '/', MISI.length);
  for (const m of B.misi.filter(Boolean)) {
    let zr = 0, zi = 0;
    const o = [];
    for (let n = 0; n <= 200; n++) {
      o.push([zr, zi]);
      const t = zr * zr - zi * zi + m[0];
      zi = 2 * zr * zi + m[1];
      zr = t;
      if (zr * zr + zi * zi > 1e6) break;
    }
    let best = null;
    for (let k = 1; k < 60 && !best; k++) {
      for (let p = 1; p < 40; p++) {
        if (o[k + p] && Math.hypot(o[k + p][0] - o[k][0], o[k + p][1] - o[k][1]) < 1e-7) { best = [k, p]; break; }
      }
    }
    let ret = 1e9;
    for (let n = 1; n < o.length && n < 80; n++) ret = Math.min(ret, Math.hypot(o[n][0], o[n][1]));
    if (!best || ret < 1e-6) bad++;
    console.log('  ', m[0].toFixed(10), m[1].toFixed(10), 'offset/size', m[2].toFixed(4), '(preper,per) of 0:', best, 'min|f^n(0)|', ret.toExponential(2));
  }
}
console.log(bad ? 'FAIL ' + bad : 'OK');
process.exit(bad ? 1 : 0);
