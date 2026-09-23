// Baby-copy chart invariants: every ok bulb's multiplier chart continues from the centre with residual < 1e-7.
import { BABIES, MISI } from '../assets/math/baby.js';
import { solveMult } from '../assets/math/mandel.js';
const t0 = Date.now();
let fails = 0;
console.log('babies', BABIES.length, 'build ms', Date.now() - t0);
for (const B of BABIES) {
  console.log(`P=${B.P} c0=${B.c0.map((x) => x.toFixed(12))} cusp=${B.cusp.map((x) => x.toFixed(10))} |A|=${B.A.toFixed(4)} argA=${B.argA.toFixed(4)} |sigma|=${B.size.toExponential(3)}`);
  for (const b of B.bulbs) {
    if (b.q === 1) continue;
    let worst = 0, fail = 0;
    const st = { zr: 0, zi: 0, cr: b.center ? b.center[0] : 0, ci: b.center ? b.center[1] : 0 };
    let lam = [0, 0];
    if (b.ok) {
      for (const ph of [0, 1.3, -1.3, 2.5]) {
        for (let k = 1; k <= 10; k++) {
          const rho = b.rhoMax * k / 10, tr = rho * Math.cos(ph), ti = rho * Math.sin(ph);
          const dr = tr - lam[0], di = ti - lam[1], n = Math.ceil(Math.hypot(dr, di) / 0.1);
          for (let s = 1; s <= n; s++) {
            const r = solveMult(st, b.per, lam[0] + dr * s / n, lam[1] + di * s / n);
            if (!(r < 1e-7)) fail++;
            worst = Math.max(worst, r);
          }
          lam = [tr, ti];
        }
      }
    }
    fails += fail;
    console.log(`  ${b.p}/${b.q} per${b.per} ok=${b.ok} R=${(b.R || 0).toExponential(2)} seedErr=${(b.seedErr || 0).toFixed(3)} rootErr=${(b.rootErr || 0).toFixed(4)} rhoMax=${(b.rhoMax || 0).toFixed(3)} worstRes=${worst.toExponential(1)} fails=${fail}`);
  }
}
console.log(fails ? 'FAIL ' + fails : 'OK', '· MISI', MISI.length);
process.exit(fails ? 1 : 0);
