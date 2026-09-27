// NAV2's Green's-theorem ruler (assets/scenes/nav2/green.js), in node — the equipotential trace and what it measures.
//   1. c = 0: the curve is the circle |z| = R_T exactly, Q = 1 to the polygon's own O(1/N²), A = π R_T², R = R_T
//   2. Q falls monotonically as c walks from 0 out along the real axis toward the cusp 1/4 (rounder → less round)
//   3. Q falls as ρ = |λ| rises at a fixed internal angle (the 1/3 root direction): the beat's press IS a loss of roundness
//   4. the area theorem's sign: A < π R_T² for every c ≠ 0 (the Laurent tail only ever takes area away)
//   5. dA/dt = ∮ v·n ds: moving c moves the edge (v > 0), holding it still reads v = 0 exactly
//   6. cost: a measure() call is well under 1 ms
import { measure, resetGreen, N_PTS, R_T, G } from '../assets/scenes/nav2/green.js';
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL ' + m); } else console.log('  ok   ' + m); };
const f = (x, k = 4) => x.toFixed(k);

console.log('1. c = 0');
resetGreen();
let g = measure(0, 0, 1 / 60);
const polyQ = Math.PI / N_PTS / Math.tan(Math.PI / N_PTS);   // the exact isoperimetric quotient of a regular N-gon
ok(g.ok === 1, 'the trace is finite');
ok(Math.abs(g.Q - polyQ) < 1e-6, `Q = ${f(g.Q, 7)} = the regular ${N_PTS}-gon's ${f(polyQ, 7)}`);
ok(Math.abs(g.A - Math.PI * R_T * R_T) < 1e-3, `A = ${f(g.A)} ≈ π R_T² = ${f(Math.PI * R_T * R_T)}`);
ok(Math.abs(g.R - R_T) < 1e-6, `R = ${f(g.R, 6)} = R_T`);

console.log('2. along the real axis toward the cusp');
const xs = [0, 0.05, 0.1, 0.15, 0.2, 0.24];
const qs = xs.map((x) => { resetGreen(); return measure(x, 0, 1 / 60).Q; });
console.log('   ' + xs.map((x, i) => `${x}:${f(qs[i])}`).join('  '));
ok(qs.every((q, i) => i === 0 || q < qs[i - 1]), 'Q falls monotonically 0 → 0.24');
ok(qs[5] > 0.9 && qs[5] < 0.97, `Q at the cusp side (c = 0.24) = ${f(qs[5])}: internal angle 0 is the fat round blob (nav2.js RHO_DEGEN), so it stays over 0.9 — the arms live at the other angles (3.)`);

console.log('3. along the 1/3 root direction as ρ rises');
const rhos = [0.2, 0.5, 0.8, 0.95, 0.99];
const q3 = rhos.map((r) => { const a = 2 * Math.PI / 3, lr = r * Math.cos(a), li = r * Math.sin(a);
  const cr = lr / 2 - (lr * lr - li * li) / 4, ci = li / 2 - (2 * lr * li) / 4;   // c = λ/2 − λ²/4 on the cardioid
  resetGreen(); return measure(cr, ci, 1 / 60).Q; });
console.log('   ' + rhos.map((r, i) => `ρ${r}:${f(q3[i])}`).join('  '));
ok(q3.every((q, i) => i === 0 || q < q3[i - 1]), 'Q falls as ρ rises toward the 1/3 root');
ok(q3[0] > 0.97 && q3[4] < 0.8, `ρ .2 reads ${f(q3[0])} (a circle), ρ .99 reads ${f(q3[4])} (arms)`);

console.log('4. the area theorem');
const As = [[0.1, 0.1], [-0.5, 0.3], [-0.75, 0.05], [0.28, 0.01]].map(([x, y]) => { resetGreen(); return measure(x, y, 1 / 60).A; });
ok(As.every((A) => A < Math.PI * R_T * R_T), 'A < π R_T² for every c ≠ 0 tried: ' + As.map((a) => f(a, 3)).join(' '));

console.log('5. the edge moves when c moves');
resetGreen();
measure(-0.2, 0.1, 1 / 60);
let g2 = measure(-0.2, 0.1, 1 / 60);
ok(g2.v === 0 && g2.dA === 0, 'c held still: v = 0 and dA/dt = 0 exactly');
g2 = measure(-0.21, 0.11, 1 / 60);
ok(g2.v > 0, `c moved 0.014: mean edge speed ${f(g2.v, 3)} units/s, dA/dt ${f(g2.dA, 3)}`);

console.log('6. cost');
const t0 = performance.now();
for (let i = 0; i < 200; i++) measure(-0.3 + 0.001 * i, 0.2, 1 / 60);
const ms = (performance.now() - t0) / 200;
ok(ms < 1, `measure() ${f(ms, 3)} ms (gate 1 ms)`);
console.log(fails ? `test_green: ${fails} FAIL` : 'test_green: OK');
process.exit(fails ? 1 : 0);
