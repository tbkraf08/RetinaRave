// GIELIS's numerics (assets/math/gielis.js), in node — the superformula, the closure arithmetic, the species table,
// Green's ruler and the GLSL twin's constants.
//   1. the circle limit: n1 → ∞ is a circle for ANY m (Q = the 512-gon's, to 1e-4)
//   2. the p/q closure: m = 3/2 closes after exactly 2 turns with a symmetric lean, 4 with a lopsided one
//   3. the spherical product is the unit sphere when both curves are 1
//   4. a known star's Q (m = 5, n1 = 1, n2 = n3 = 1) and the per-family rest → beat swing the scene is gated on
//   8. pass 1: the rest state is NOT a circle (the root in 0.90-0.95), and nothing the lean can do grows a family past
//      its own radius — equator at the beat's pinch x latitude at N1_PHI (nest.js normOf, which the deep N1_BEAT forced)
//   5. the interval table: 12 entries, root 1/1, fifth 3/2, every one closing in ≤ 8 turns
//   6. the GLSL twin's constants vs the JS to 0
//   7. cost: greenQ() at 512 samples well under 1 ms
import { sf, point3, closure, mOf, mTable, greenQ, GLSL, TAU, N1_MIN, R_MAX, BASE_MIN, M0, QCAP, N_Q, RATIO } from '../assets/math/gielis.js';
import { BASE, N1_REST, N1_BEAT, TEMPLATES, TEMPLATE_NAMES, normOf, N1_PHI, PHI_MAX, LEAN_C, LEAN_V, LEAN_MIN, LEAN_MAX } from '../assets/scenes/gielis/nest.js';

let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL ' + m); } else console.log('  ok   ' + m); };
const f = (x, k = 4) => x.toFixed(k);
const clamp2 = (x) => Math.min(LEAN_MAX, Math.max(LEAN_MIN, x));

console.log('1. the circle limit');
const polyQ = Math.PI / N_Q / Math.tan(Math.PI / N_Q);   // the exact isoperimetric quotient of the regular N-gon
for (const m of [4, 3.5, 28 / 5]) {
  const g = greenQ(m, 1e6, 1, 1, 1, 1);
  ok(g.Q > 0.999 && Math.abs(g.Q - polyQ) < 1e-4, `m = ${m}, n1 = 1e6: Q = ${f(g.Q, 6)} (the ${N_Q}-gon's ${f(polyQ, 6)}), r ∈ [${f(g.rMin)}, ${f(g.rMax)}]`);
}

console.log('2. the p/q closure (m = 3/2: q = 2 turns)');
const c32 = closure(3, 2);
ok(c32.sym === 2 && c32.gen === 4, `closure(3, 2) = ${c32.sym} symmetric turns, ${c32.gen} lopsided`);
let dSym = 0, dOne = 0, dAsym = 0, dAsym4 = 0;
for (let j = 0; j < 400; j++) {
  const p = (j / 400) * TAU;
  dSym = Math.max(dSym, Math.abs(sf(p + 2 * TAU, 1.5, 3, 1, 1, 1, 1) - sf(p, 1.5, 3, 1, 1, 1, 1)));
  dOne = Math.max(dOne, Math.abs(sf(p + TAU, 1.5, 3, 1, 1, 1, 1) - sf(p, 1.5, 3, 1, 1, 1, 1)));
  dAsym = Math.max(dAsym, Math.abs(sf(p + 2 * TAU, 1.5, 3, 1, 4, 1, 1) - sf(p, 1.5, 3, 1, 4, 1, 1)));
  dAsym4 = Math.max(dAsym4, Math.abs(sf(p + 4 * TAU, 1.5, 3, 1, 4, 1, 1) - sf(p, 1.5, 3, 1, 4, 1, 1)));
}
ok(dSym < 1e-9, `symmetric lean: r(φ + 4π) = r(φ) to ${dSym.toExponential(2)}`);
ok(dOne > 0.01, `and r(φ + 2π) ≠ r(φ) (max |Δ| ${f(dOne)}) — one turn does not close`);
ok(dAsym > 0.01 && dAsym4 < 1e-9, `lopsided lean (n3 = 4): 2 turns leave ${f(dAsym)}, 4 turns close to ${dAsym4.toExponential(2)}`);

console.log('3. the spherical product');
let sph = 0;
for (let i = 0; i < 40; i++) {
  for (let j = 0; j < 20; j++) {
    const th = (i / 40) * TAU - Math.PI, ph = (j / 19 - 0.5) * Math.PI;
    const p = point3(th, ph, [4, 1e6, 1, 1, 1, 1], [4, 1e6, 1, 1, 1, 1]);
    sph = Math.max(sph, Math.abs(Math.hypot(p[0], p[1], p[2]) - 1));
  }
}
ok(sph < 1e-6, `r1 = r2 = 1 gives the unit sphere: max |‖P‖ − 1| = ${sph.toExponential(2)}`);

console.log('4. the ruler — a known star, and the breath the scene is gated on');
const star = greenQ(5, 1, 1, 1, 1, 1);
ok(star.Q > 0 && star.Q < 0.75, `m = 5, n1 = 1, n2 = n3 = 1: Q = ${f(star.Q)} (r ∈ [${f(star.rMin)}, ${f(star.rMax)}])`);
let minSwing = 9, minRest = 9, maxRest = 0, rootRest = 0;
const rows = mTable().map((e) => {
  const r = greenQ(e.m, N1_REST, BASE[0], BASE[1], BASE[2], BASE[3]).Q;
  const b = greenQ(e.m, N1_BEAT, BASE[0], BASE[1], BASE[2], BASE[3]).Q;
  minSwing = Math.min(minSwing, r - b);
  minRest = Math.min(minRest, r);
  maxRest = Math.max(maxRest, r);
  if (e.interval === 0) rootRest = r;
  return `i${e.interval} m ${f(e.m, 3)} q${e.turns} ${f(r, 3)}→${f(b, 3)}`;
});
console.log('   ' + rows.join(' · '));
// Pass 1's gate replaces "rest Q >= 0.9" (which was a gate on the rest being a CIRCLE). The user asked for more shapes:
// the rest state must now show the species, so the root reads as a clearly rounded square and nothing is a circle.
ok(rootRest > 0.9 && rootRest < 0.95, `the root (m ${M0}) rests at Q ${f(rootRest)} — a rounded square, in the brief's 0.90-0.95`);
ok(maxRest < 0.96, `no family rests as a circle (roundest ${f(maxRest)}) at n1 = N1_REST ${N1_REST}`);
ok(minRest > 0.7, `and none rests as a star either (starriest ${f(minRest)}) — the beat has somewhere to go`);
ok(minSwing >= 0.15, `beat swing ≥ 0.15 on every family (worst ${f(minSwing)}) at n1 = N1_BEAT ${N1_BEAT}`);
for (let t = 0; t < TEMPLATES.length; t++) {
  const L = TEMPLATES[t], g = greenQ(6, N1_REST, L[0], L[1], L[2], L[3]), h = greenQ(6, N1_BEAT, L[0], L[1], L[2], L[3]);
  ok(g.Q > 0.5 && g.Q - h.Q > 0.05, `template ${TEMPLATE_NAMES[t]} (${L.join(', ')}) at m 6: Q ${f(g.Q)} → ${f(h.Q)}, r ≤ ${f(g.rMax)}`);
}
// Pass 1 item 2: every template must actually DO something (`round` was BASE, so one section in four showed no lean).
ok(TEMPLATES.every((L) => L.some((v, i) => Math.abs(v - BASE[i]) > 0.1)), 'all four templates differ from BASE — no section is a no-op');
ok(new Set(TEMPLATES.map((L) => L.join(','))).size === 4, 'and the four differ from each other: ' + TEMPLATES.map((L, i) => `${TEMPLATE_NAMES[i]} (${L.join(', ')})`).join(' · '));
// …and the twelve families must differ from each other at a plausible chroma, at the SAME m, so it is the lean alone.
const chDemo = [1, 0.15, 0.6, 0.2, 0.8, 0.3, 0.1, 0.9, 0.25, 0.5, 0.35, 0.45];
const qByFam = chDemo.map((c) => greenQ(6, N1_REST, clamp2(1 - LEAN_C * c), 1, 1, 1).Q);
ok(new Set(qByFam.map((q) => q.toFixed(3))).size === 12 && qByFam[0] === Math.min(...qByFam),
  'twelve chroma values give twelve different shapes at one m, the loudest the starriest: Q ' + qByFam.map((q) => f(q, 3)).join(' '));
const vSwing = [0, 0.5, 1].map((v) => greenQ(6, N1_REST, 1, clamp2(1 + LEAN_V * (0.5 - v) * 2), 1, 1).Q);
ok(Math.abs(vSwing[0] - vSwing[2]) > 0.02, `valence 0 / .5 / 1 moves the lean: Q ${vSwing.map((q) => f(q, 3)).join(' → ')}`);

console.log('5. the interval table');
const T = mTable();
ok(T.length === 12, `${T.length} entries`);
ok(T[0].p === 1 && T[0].q === 1 && T[0].m === M0, `the root is 1/1 → m = ${T[0].m}`);
ok(T[7].p === 3 && T[7].q === 2 && T[7].m === M0 * 1.5, `the fifth is 3/2 → m = ${T[7].m} (${T[7].lobes} lobes in ${T[7].turns} turn)`);
ok(T.every((e) => e.turns <= 8 && e.turnsGen <= 8), `every entry closes in ≤ 8 turns (max ${Math.max(...T.map((e) => e.turns))} symmetric, ${Math.max(...T.map((e) => e.turnsGen))} lopsided)`);
ok(T.every((e) => e.turns <= QCAP), `and in ≤ QCAP ${QCAP} with the symmetric lean the scene draws`);
ok(new Set(T.map((e) => e.m)).size === 12, 'the twelve lobe counts are distinct — twelve pitches, twelve shapes');
const exact = T.filter((e) => Math.abs(e.m - e.exact) < 1e-12).length;
console.log(`   ${exact}/12 are the exact ratio M0·p/q; the rest are snapped to denominator ≤ ${QCAP}: ` +
  T.filter((e) => Math.abs(e.m - e.exact) > 1e-12).map((e) => `i${e.interval} ${f(e.exact, 4)}→${e.num}/${e.den}`).join(', '));
ok(T.every((e) => Math.abs(e.m - (M0 * e.p) / e.q) < 0.02), 'every snapped m is within 0.02 of its exact ratio');
ok(RATIO.length === 12 && mOf(19).interval === 7, 'mOf() wraps the interval into 0..11');

console.log('6. the GLSL twin vs the JS');
const num = (re) => { const m = GLSL.match(re); return m ? +m[1] : NaN; };
const pairs = [['N1_MIN', num(/#define N1_MIN ([\d.]+)/), N1_MIN], ['R_MAX', num(/#define R_MAX ([\d.]+)/), R_MAX],
  ['BASE_MIN', num(/#define BASE_MIN ([\d.]+)/), BASE_MIN], ['GTAU', num(/#define GTAU ([\d.]+)/), TAU]];
let worst = 0;
for (const [n, g, j] of pairs) worst = Math.max(worst, Math.abs(g - j));
ok(worst < 1e-6, 'constants GLSL vs twin: ' + pairs.map(([n, g, j]) => `${n} ${g}/${f(j, 6)}`).join(' · ') + ` max |Δ| ${worst.toExponential(2)}`);
ok(/float sfR\(/.test(GLSL) && /vec3 sfPoint\(/.test(GLSL), 'the twin declares sfR() and sfPoint()');

console.log('7. cost');
const t0 = performance.now();
for (let i = 0; i < 200; i++) greenQ(5.6, 2 + 0.01 * i, 1, 1, 1, 1);
const ms = (performance.now() - t0) / 200;
ok(ms < 1, `greenQ() at ${N_Q} samples: ${f(ms, 4)} ms (gate 1 ms)`);
console.log('8. the radius normalisation (pass 1: the deep pinch may not grow a family)');
// The truth is sampled 8x denser than nest.js normOf does, over exactly the theta turn and the DRAWN latitude range,
// so this also measures how much normOf's own 64/32 sampling can under-read a peak.
const latMax = (m, n1, L) => { let r = 0; for (let j = 0; j <= 512; j++) { const v = sf((j / 512 - 0.5) * Math.PI * PHI_MAX, m, n1, L[0], L[1], L[2], L[3]); if (v > r) r = v; } return r; };
const eqMax = (m, n1, L) => { let r = 0; for (let j = 0; j < 4096; j++) { const v = sf((j / 4096) * TAU, m, n1, L[0], L[1], L[2], L[3]); if (v > r) r = v; } return r; };
// Every lean the scene can reach: the family's own base (n2 from its chroma, n3 from the mood's valence) plus the
// section template's offset, at every morph, including a cross-fade between two templates. a and b are the template's
// alone (pass 1 item 1 moved the sub's fattening onto the family's RADIUS, which is why a = 1 throughout — the a > 1
// case is what made a 64-sample normaliser unsafe).
const LEANS = [];
for (const ch of [0, 0.5, 1]) {
  for (const val of [0, 0.5, 1]) {
    for (const mo of [0, 0.5, 1]) {
      for (const A of TEMPLATES) {
        for (const B of TEMPLATES) {
          for (const tf of [0, 0.5, 1]) {
            const T = [0, 1, 2, 3].map((i) => (A[i] + (B[i] - A[i]) * tf - BASE[i]) * mo);
            LEANS.push([clamp2(1 - LEAN_C * ch + T[0]), clamp2(1 + LEAN_V * (0.5 - val) * 2 + T[1]), BASE[2] + T[2], BASE[3] + T[3]]);
          }
        }
      }
    }
  }
}
let wRaw = 0, wNorm = 0, wCase = '', wnCase = '';
for (const L of LEANS) {
  for (const e of mTable()) {
    for (const n1 of [N1_REST, 1.2, N1_BEAT]) {
      const rq = eqMax(e.m, n1, L), lt = latMax(e.m, N1_PHI, L), nz = normOf(e.m, n1, L, e.m, N1_PHI);
      if (rq * lt > wRaw) { wRaw = rq * lt; wCase = `m ${f(e.m, 2)} n1 ${n1} lean (${L.map((x) => f(x, 2)).join(', ')})`; }
      if (rq * lt * nz > wNorm) { wNorm = rq * lt * nz; wnCase = `m ${f(e.m, 2)} n1 ${n1} lean (${L.map((x) => f(x, 2)).join(', ')})`; }
    }
  }
}
ok(wRaw > 1.4, `unnormalised, the worst reachable lean grows the drawn radius to ${f(wRaw, 3)}x (${wCase}) where the camera frames RAD 1`);
// normOf reads its maxima at 64 t samples (one half-period, exact for every m) and 33 phi samples, so it can still
// under-read a sharp peak slightly; the camera's own FILLMAX 0.85 absorbs that, which is why the gate is 1.01 and not 1.
ok(wNorm <= 1.01, `normalised, the worst is ${f(wNorm, 4)}x (${wnCase}) over ${LEANS.length * 36} cases — inside FILLMAX 0.85`);
ok(Math.abs(normOf(4, N1_REST, [1, 1, 1, 1], 4, N1_PHI) - 1) < 1e-12 && PHI_MAX > 0, 'a symmetric lean normalises by exactly 1 (a no-op on those frames)');

console.log(fails ? `test_gielis: ${fails} FAIL` : 'test_gielis: OK');
process.exit(fails ? 1 : 0);
