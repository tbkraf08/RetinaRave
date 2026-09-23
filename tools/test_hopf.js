// Hopf fibration invariants (assets/math/hopf.js):
//  1. every fibre is a round circle after stereographic projection: planar and constant radius (1e-9)
//  2. fibres over distinct base points never meet: sampled min distance > 0 (and > 1e-3 for base points 0.05 apart)
//  3. fibres over latitude theta lie on the torus (R = 1/cos(theta/2), r = tan(theta/2)): |dist| < 1e-9
//  4. the Hopf flow, the SU(2) tumble and the pole offset preserve 1 and 2 (they are isometries of S³)
//  5. the Hopf map of every fibre point is its base point (1e-12); the (p,q) knot lies on the same torus
import { fibre, fibre4, hopfMap, torusRadii, torusDist, knot, circleOf3 } from '../assets/math/hopf.js';
let fails = 0;
const fail = (m) => { fails++; console.log('FAIL', m); };
const N = 96, TAU = Math.PI * 2;
const pts = (th, ph, psi0, al, de) => Array.from({ length: N }, (_, i) => fibre(th, ph, i / N * TAU, psi0, al, de));
function circleErr(P) { // max deviation from the circle through three of the points: planarity + radius
  const C = circleOf3(P[0], P[N / 3 | 0], P[(2 * N / 3) | 0]);
  let e = 0;
  for (const p of P) {
    const d = [p[0] - C.centre[0], p[1] - C.centre[1], p[2] - C.centre[2]];
    e = Math.max(e, Math.abs(Math.hypot(...d) - C.radius), Math.abs(d[0] * C.normal[0] + d[1] * C.normal[1] + d[2] * C.normal[2]));
  }
  return e;
}
function minDist(A, B) { let m = 1e9; for (const a of A) for (const b of B) m = Math.min(m, Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])); return m; }
const cases = [[0, 0, 0], [0.7, 1.3, 0.2], [2.1, -0.4, 0.0], [0.7, 1.3, 0.35]]; // (psi0, alpha, delta)
let worstCircle = 0, worstTorus = 0, minSep = 1e9, worstBase = 0;
for (const [psi0, al, de] of cases) {
  for (const th of [0.2, 0.8, Math.PI / 2, 2.2, 2.9]) {
    for (const ph of [0, 0.9, 2.5, 4.4]) {
      const P = pts(th, ph, psi0, al, de);
      worstCircle = Math.max(worstCircle, circleErr(P));
      if (!al && !de) { const { R, r } = torusRadii(th); for (const p of P) worstTorus = Math.max(worstTorus, Math.abs(torusDist(p, R, r))); }
      minSep = Math.min(minSep, minDist(P, pts(th, ph + 0.05, psi0, al, de)), minDist(P, pts(th + 0.05, ph, psi0, al, de)), minDist(P, pts(th, ph + 2, psi0, al, de)));
      for (let i = 0; i < N; i += 7) { const b = hopfMap(fibre4(th, ph, i / N * TAU + psi0)); const e = [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)]; worstBase = Math.max(worstBase, Math.hypot(b[0] - e[0], b[1] - e[1], b[2] - e[2])); }
    }
  }
}
// knot on the torus, (1,1) is a fibre
let worstKnot = 0;
for (const [p, q] of [[1, 1], [2, 3], [1, 2], [3, 5], [0, 1]]) { const th = 1.1, { R, r } = torusRadii(th); for (let i = 0; i < 200; i++) worstKnot = Math.max(worstKnot, Math.abs(torusDist(knot(th, p, q, i / 200 * TAU), R, r))); }
const knotIsFibre = circleErr(Array.from({ length: N }, (_, i) => knot(1.1, 1, 1, i / N * TAU)));
console.log(`circle error ${worstCircle.toExponential(2)} · torus distance ${worstTorus.toExponential(2)} · min fibre separation ${minSep.toFixed(4)} · hopf map error ${worstBase.toExponential(2)} · knot on torus ${worstKnot.toExponential(2)} · (1,1) knot circle error ${knotIsFibre.toExponential(2)}`);
if (!(worstCircle < 1e-9)) fail('fibres are not round circles');
if (!(worstTorus < 1e-9)) fail('fibres leave the torus');
if (!(minSep > 1e-3)) fail('fibres over distinct base points meet');
if (!(worstBase < 1e-12)) fail('hopf map does not return the base point');
if (!(worstKnot < 1e-9)) fail('knot leaves the torus');
if (!(knotIsFibre < 1e-9)) fail('(1,1) knot is not a fibre');
console.log(fails ? 'FAIL ' + fails : 'OK');
process.exit(fails ? 1 : 0);
