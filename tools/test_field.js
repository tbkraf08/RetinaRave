// assets/math/field.js — NAV2's chart-free numerics, proven against closed forms and against NAV's own charts.
// node tools/test_field.js
import { BULBS, buildRayGrid, setGrid, extC, solveMult } from '../assets/math/mandel.js';
import { findCycle, rhoGrad, pot, dist, potGrad, rayTo, cleanLine, nearestRational, cardLambda, mkCyc, N_MAX, TAU } from '../assets/math/field.js';

let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL ' + m); } else console.log('  ok   ' + m); };
const near = (a, b, e, m) => ok(Math.abs(a - b) <= e, m + ' (' + a + ' vs ' + b + ', tol ' + e + ')');

// 1. the period at every BULBS centre --------------------------------------------------------------
console.log('period at every BULBS centre:');
let pmax = 0;
for (const b of BULBS) {
  const c = findCycle(b.center[0], b.center[1], mkCyc(), N_MAX);
  pmax = Math.max(pmax, c.rho);
  ok(c.has === 1 && c.q === b.per, `${b.p}/${b.q} centre -> has ${c.has} q ${c.q} (want ${b.per}) rho ${c.rho.toExponential(2)}`);
}
ok(pmax < 1e-6, 'every centre is superattracting: max rho ' + pmax.toExponential(2));

// 2. lambda vs the cardioid closed form ------------------------------------------------------------
console.log('lambda vs lambda = 1 - sqrt(1 - 4c) on the main cardioid:');
let wl = 0;
for (const [cr, ci] of [[0, 0], [-0.2, 0.3], [0.1, 0.2], [-0.5, 0.35], [0.2, 0.05], [-0.74, 0.02]]) {
  const f = findCycle(cr, ci, mkCyc(), N_MAX), L = cardLambda(cr, ci);
  const d = Math.hypot(f.lr - L[0], f.li - L[1]);
  wl = Math.max(wl, d);
  ok(f.has === 1 && f.q === 1 && d < 1e-8, `c ${cr},${ci} q ${f.q} |dlambda| ${d.toExponential(2)} rho ${f.rho.toFixed(6)}`);
}
near(wl, 0, 1e-8, 'worst cardioid lambda error');

// 3. lambda vs solveMult (NAV's own chart): put c where the chart says lambda = rho e^{i phi} ------
console.log('lambda vs solveMult continuation (NAV bulbChart), 1e-8:');
for (const bi of [5, 7, 9]) {
  const b = BULBS[bi];
  for (const [rho, phi] of [[0.4, 0.7], [0.8, -1.1], [0.95, 2.0]]) {
    const st = { zr: 0, zi: 0, cr: b.center[0], ci: b.center[1] };
    let bad = 0, n = 24;
    for (let k = 1; k <= n; k++) {           // continuation in steps, as bulbChart does
      const t = k / n, lr = rho * t * Math.cos(phi * t), li = rho * t * Math.sin(phi * t);
      if (!(solveMult(st, b.per, lr, li) < 1e-7)) bad = 1;
    }
    const f = findCycle(st.cr, st.ci, mkCyc(), N_MAX);
    const dl = Math.hypot(f.lr - rho * Math.cos(phi), f.li - rho * Math.sin(phi));
    ok(!bad && f.has === 1 && f.q === b.per && dl < 1e-8,
      `bulb ${b.p}/${b.q} rho ${rho} phi ${phi}: q ${f.q} |dlambda| ${dl.toExponential(2)}`);
  }
}

// 4. accuracy deep against the wall ----------------------------------------------------------------
console.log('accuracy at the wall (rho 0.985 / 0.995 on the 1/3 bulb):');
for (const rho of [0.985, 0.995]) {
  const b = BULBS[5], st = { zr: 0, zi: 0, cr: b.center[0], ci: b.center[1] };
  const n = 60;
  for (let k = 1; k <= n; k++) solveMult(st, b.per, rho * k / n, 0);
  const f = findCycle(st.cr, st.ci, mkCyc(), N_MAX);
  near(f.rho, rho, 3e-9, `rho ${rho} recovered, q ${f.q}, n ${f.n}`);
}

// 5. rhoGrad vs d|1 - sqrt(1-4c)|/dc on the cardioid ----------------------------------------------
console.log('rhoGrad vs the derivative of |1 - sqrt(1 - 4c)|:');
for (const [cr, ci] of [[-0.2, 0.3], [0.1, 0.2], [-0.5, 0.2]]) {
  const f = findCycle(cr, ci, mkCyc(), N_MAX), g = rhoGrad(cr, ci, f.q, f.zr, f.zi);
  // lambda = 1 - sqrt(1-4c), dlambda/dc = 2/sqrt(1-4c) = 2/(1-lambda); d|lambda|/dx = Re(conj(lambda)/|lambda| dl/dc)
  const ur = 1 - f.lr, ui = -f.li, m2 = ur * ur + ui * ui;
  const dr = 2 * ur / m2, di = -2 * ui / m2;          // 2/(1-lambda)
  const hr = f.lr / f.rho, hi = f.li / f.rho;         // lambda/|lambda|
  const gx = hr * dr + hi * di;                       // Re(conj(h) * dl/dc)
  const gy = hr * (-di) + hi * dr;                    // Re(conj(h) * i * dl/dc)
  near(g.gx, gx, 1e-6, `c ${cr},${ci} d rho/dx`);
  near(g.gy, gy, 1e-6, `c ${cr},${ci} d rho/dy`);
  near(g.dl, Math.hypot(dr, di), 1e-6, `c ${cr},${ci} |dlambda/dc|`);
}

// 6. negatives: no attracting cycle ----------------------------------------------------------------
console.log('negatives (has must be 0):');
for (const [cr, ci, why] of [[0.3, 0, 'outside M on the real axis'], [0, 1, 'c = i, a Misiurewicz point (repelling 2-cycle)'],
  [-0.75, 0, 'c = -0.75, the parabolic cusp (lambda = -1)'], [-2, 0, 'c = -2, the antenna tip'], [0.4, 0.4, 'far outside']]) {
  const f = findCycle(cr, ci, mkCyc(), N_MAX);
  ok(f.has === 0, `${why}: has ${f.has} q ${f.q} rho ${f.rho.toExponential(3)} res ${f.res.toExponential(2)}`);
}
{
  // At the cusp the critical orbit approaches z = -0.5 ALTERNATING (e -> -e + e^2), so |f(z)-z| ~ 2e stays loose while
  // |f^2(z)-z| ~ 2e^3 is inside RET_TOL: the nearest-return detector legitimately names q = 2 and lambda = lambda_1^2 = +1.
  const f = findCycle(-0.75, 0, mkCyc(), N_MAX);
  ok(f.q === 2, 'c = -0.75: the nearest return names q 2 (the alternating parabolic approach), got ' + f.q);
  near(f.rho, 1, 1e-5, 'c = -0.75 is parabolic: rho = 1');
  near(f.lr, 1, 1e-5, 'c = -0.75: lambda = lambda_1^2 = +1');
}

// 7. the exterior: distance estimate at the antenna, potential against NAV's Boettcher grid --------
console.log('distance estimate near the antenna (-2, 0), within a factor of 4 of the true distance:');
for (const d0 of [0.3, 0.1, 0.03, 0.01, 0.003]) {
  const d = dist(-2 - d0, 0), r = d / d0;
  ok(r > 0.25 && r < 4, `c = ${(-2 - d0).toFixed(3)}: DE ${d.toExponential(3)} true ${d0} ratio ${r.toFixed(3)}`);
}
ok(dist(-1.5, 0) === 0 && dist(0, 0) === 0, 'DE is 0 for an interior c (no escape)');

console.log('pot() vs buildRayGrid (the inverse Boettcher table NAV navigates on), 0.01:');
setGrid(buildRayGrid(96, 4, 1, -4));
let wp = 0;
for (const th of [0.05, 0.2, 0.37, 0.61, 0.83]) {
  for (const lg of [0.5, -0.5, -1.5, -3]) {
    const c = extC(th, lg, [0, 0]), p = pot(c[0], c[1]);
    wp = Math.max(wp, Math.abs(p - lg));
    ok(Math.abs(p - lg) < 0.01, `theta ${th} log2G ${lg} -> c ${c[0].toFixed(5)},${c[1].toFixed(5)} pot ${p.toFixed(5)}`);
  }
}
near(wp, 0, 0.01, 'worst potential error against the grid');

console.log('potGrad points outward and has the right magnitude (1/(dist*ln2) to a factor of 3):');
for (const [cr, ci] of [[-2.05, 0], [0.5, 0.5], [-1.3, 0.35], [0.3, 0.02]]) {
  const g = potGrad(cr, ci), m = Math.hypot(g.x, g.y), d = dist(cr, ci), want = 1 / (d * Math.LN2);
  const st = Math.min(0.01, 0.5 * d);   // a step longer than the distance to M leaves the local frame near the cusp
  const c2 = [cr + st * g.x / m, ci + st * g.y / m];
  ok(pot(c2[0], c2[1]) > pot(cr, ci), `c ${cr},${ci}: a step along grad raises log2G`);
  ok(m > want / 3 && m < want * 3, `  |grad| ${m.toExponential(3)} vs 1/(d ln2) ${want.toExponential(3)}`);
}

// 7b. the drop's ruler ----------------------------------------------------------------------------
console.log('rayTo / cleanLine (the drop\'s ruler):');
{
  const t = rayTo(-0.2, 0.62, 0, 1, -0.67);     // north out of the cardioid's shoulder
  ok(t > 0, 'a ray north from (-0.2, 0.62) reaches log2G -0.67 at t ' + t.toFixed(5));
  near(pot(-0.2, 0.62 + t), -0.67, 0.01, '  and the potential at the landing point is the target');
  // doDrop's own retry: the straight normal often grazes a dendrite, so the direction is retried at +-5 degrees
  // doDrop's own retry: a 1.2-unit ray from near the set grazes a dendrite more often than not, so the direction is
  // retried over +-45 deg and cleanLine's bad-sample COUNT ranks them
  let found = -1, best = 1e9;
  for (let k = 0; k < 13; k++) {
    const a = k === 0 ? 0 : ((k & 1) ? 1 : -1) * 0.131 * Math.ceil(k / 2);
    const dx = -Math.sin(a), dy = Math.cos(a), tk = rayTo(-0.2, 0.62, dx, dy, -0.67);
    if (!(tk > 0)) continue;
    const bad = cleanLine(-0.2, 0.62, dx, dy, tk);
    if (bad < best) { best = bad; found = k; }
  }
  ok(best === 0, '  one of the thirteen +-7.5 deg retries is clean (try ' + found + ', bad ' + best + ')');
  ok(cleanLine(-0.2, 0.62, 0, 1, t) > 0, '  the straight normal from here is NOT clean (bad ' + cleanLine(-0.2, 0.62, 0, 1, t) + ')');
  ok(cleanLine(0.4, 0, -1, 0, 1) > 0, 'a ray west from (0.4, 0) goes back INTO the cardioid: not clean');
  ok(rayTo(0, 0, 1, 0, 9) === 0, 'an unreachable target returns 0 (log2 G = 9 is past RAY_TMAX)');
  ok(rayTo(-1, 0, -1, 0, -2) > 0, 'a ray west from the period-2 centre still finds the -2 equipotential');
}

// 8. Farey ----------------------------------------------------------------------------------------
console.log('nearestRational(x, 7):');
for (const [x, p, q] of [[0.3333, 1, 3], [0.5, 1, 2], [0.4, 2, 5], [0.71, 5, 7], [0.001, 0, 1], [0.999, 0, 1],
  [0.6666, 2, 3], [0.2, 1, 5], [0.1428, 1, 7], [0.24, 1, 4]]) {
  const r = nearestRational(x, 7);
  ok(r.p === p && r.q === q, `${x} -> ${r.p}/${r.q} (want ${p}/${q}) err ${r.err.toExponential(2)}`);
}
ok(nearestRational(1.3333, 7).q === 3, 'x is taken mod 1');

// 9. the 1/3 root is the cardioid's highest point (the geometry the gate policy relies on) ---------
{
  const a = TAU / 3, mr = Math.cos(a), mi = Math.sin(a);
  const rt = [mr / 2 - (mr * mr - mi * mi) / 4, mi / 2 - mr * mi / 2];
  near(rt[1], 0.64952, 1e-4, 'the 1/3 root sits at Im c = 0.6495');
  const f = findCycle(rt[0], rt[1], mkCyc(), N_MAX);
  ok(f.has === 0, 'the root itself is parabolic: has 0');
  const inr = findCycle(rt[0] - 0.004, rt[1] + 0.008, mkCyc(), N_MAX);
  ok(inr.has === 1 && inr.q === 3, 'just past the root the period is 3 (q ' + inr.q + ', rho ' + inr.rho.toFixed(4) + ')');
}

console.log(fails ? `\ntest_field: ${fails} FAIL` : '\ntest_field: OK');
process.exit(fails ? 1 : 0);
