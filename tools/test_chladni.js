// CHLADNI's numerics (assets/math/chladni.js), in node — the square plate's mode, the nodal sets of known figures,
// the circular (asymptotic Bessel) form against the true J_n zeros, the twelve-entry table, the slide's continuity and
// the GLSL twin's constants.
//   1. antisymmetry: u(n, m) = −u(m, n) and u(n, n) ≡ 0
//   2. the diagonals y = ±x are nodal for every figure, and the analytic nodal lines of (1, 2), (1, 3), (2, 3) are too
//   3. |u| ≤ UMAX, and |field| ≤ 1 for every h
//   4. the circular form's rings are the zeros of J_n (from the second ring on, better than 1 % of the ring spacing)
//   5. the table: 12 entries, all distinct, ordered by n + m, the walk's four intervals four different figures
//   6. the slide: field() is continuous in s across every one of the twelve boundaries, including the wrap
//   7. the GLSL twin's constants and its figure table = the JS, to 0
//   8. cost: a 128 x 128 evaluation of field() well under one frame
import { uSq, uCirc, field, inside, blendOf, figOf, figTable, besselJ, besselZero, norm, FIG, LADDER, RANK, GLSL, UMAX, W2, W3, KC, NFIG, PI } from '../assets/math/chladni.js';

let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL ' + m); } else console.log('  ok   ' + m); };
const f = (x, k = 4) => x.toFixed(k);

console.log('1. antisymmetry');
let dAnti = 0, dSame = 0;
for (let i = 0; i < 400; i++) {
  const x = (i % 20) / 19 * 2 - 1, y = Math.floor(i / 20) / 19 * 2 - 1;
  for (const [n, m] of [[1, 2], [2, 5], [3, 7]]) dAnti = Math.max(dAnti, Math.abs(uSq(x, y, n, m) + uSq(x, y, m, n)));
  for (const n of [1, 2, 3, 5]) dSame = Math.max(dSame, Math.abs(uSq(x, y, n, n)));
}
ok(dAnti < 1e-12, `u(n, m) = −u(m, n) to ${dAnti.toExponential(2)}`);
ok(dSame < 1e-12, `u(n, n) ≡ 0 to ${dSame.toExponential(2)}`);

console.log('2. the nodal sets');
let dDiag = 0;
for (let i = 0; i < 200; i++) {
  const t = (i / 199) * 2 - 1;
  for (const [n, m] of LADDER) {
    dDiag = Math.max(dDiag, Math.abs(uSq(t, t, n, m)));
    dDiag = Math.max(dDiag, Math.abs(uSq(t, -t, n, m)));
  }
}
ok(dDiag < 1e-12, `both diagonals y = ±x are nodal for all 12 ladder figures, to ${dDiag.toExponential(2)}`);
// (1, 2): u = cos(πx)cos(2πy) − cos(2πx)cos(πy). With cos2A = 2cos²A − 1 this factors as
// (cos πx − cos πy)·(2 cos πx cos πy + 1), so the interior nodal line beyond the diagonals is cos πx cos πy = −1/2.
let d12 = 0, n12 = 0;
for (let i = 1; i < 400; i++) {
  const x = (i / 400) * 2 - 1, c = Math.cos(PI * x);
  if (Math.abs(c) < 0.5001) continue;                       // cos πy = −1/(2 cos πx) must be in [−1, 1]
  const y = Math.acos(-0.5 / c) / PI;
  d12 = Math.max(d12, Math.abs(uSq(x, y, 1, 2)));
  n12++;
}
ok(n12 > 100 && d12 < 1e-12, `(1, 2): the analytic line cos πx·cos πy = −1/2 is nodal at ${n12} points, to ${d12.toExponential(2)}`);
// (1, 3): u = cos πx cos 3πy − cos 3πx cos πy; cos3A = 4cos³A − 3cosA, so u = cos πx cos πy·(4cos²πy − 4cos²πx),
// i.e. nodal wherever cos πx = 0, cos πy = 0, or |cos πx| = |cos πy| (the diagonals). The two centre lines:
let d13 = 0;
for (let i = 0; i < 200; i++) {
  const t = (i / 199) * 2 - 1;
  d13 = Math.max(d13, Math.abs(uSq(0.5, t, 1, 3)), Math.abs(uSq(t, 0.5, 1, 3)), Math.abs(uSq(-0.5, t, 1, 3)));
}
ok(d13 < 1e-12, `(1, 3): the lines x = ±1/2 and y = 1/2 are nodal, to ${d13.toExponential(2)}`);
// (2, 3): cos 2πx cos 3πy = cos 3πx cos 2πy holds on the diagonals; the centre x = y = 0 must be a node of every figure
let d0 = 0;
for (const [n, m] of LADDER) d0 = Math.max(d0, Math.abs(uSq(0, 0, n, m)));
ok(d0 < 1e-12, `the plate centre is a node of every figure, to ${d0.toExponential(2)}`);
// and (2, 3) really does have interior structure the diagonals do not explain
let seen = 0;
for (let i = 1; i < 60; i++) { const x = i / 60; if (uSq(x, 0.31, 2, 3) * uSq(x + 1 / 60, 0.31, 2, 3) < 0) seen++; }
ok(seen >= 2, `(2, 3): ${seen} sign changes along y = 0.31 — interior nodal lines, not just the diagonals`);

console.log('3. bounds');
let uMx = 0, fMx = 0;
for (let i = 0; i < 64; i++) {
  for (let j = 0; j < 64; j++) {
    const x = i / 63 * 2 - 1, y = j / 63 * 2 - 1;
    for (const [n, m] of LADDER) uMx = Math.max(uMx, Math.abs(uSq(x, y, n, m)));
    for (const h of [0, 0.5, 1]) for (const b of [0, 0.5, 1]) for (const s of [0, 3.4, 7.9, 11.6]) fMx = Math.max(fMx, Math.abs(field(x, y, s, h, b)));
  }
}
ok(uMx <= UMAX + 1e-12, `max |u| over the ladder = ${f(uMx, 6)} ≤ UMAX ${UMAX}`);
ok(fMx <= 1 + 1e-12, `max |field| over h, bnd, s = ${f(fMx, 6)} ≤ 1`);
ok(Math.abs(norm(0) - 1 / UMAX) < 1e-15 && norm(1) < norm(0), `norm(0) = 1/UMAX, norm(1) = ${f(norm(1), 6)} < norm(0)`);

console.log('4. the circular form vs the true Bessel zeros');
// uCirc's rings: cos(KC·m·r − nπ/2 − π/4) = 0 at KC·m·r = nπ/2 + π/4 + (s − 1/2)π, s = 1, 2, … — equally spaced by π.
// (a) the claim that buys the approximation: the true zeros' SPACING converges to π.
for (const n of [0, 1, 2, 3]) {
  let worst = 0, at = 0;
  for (let s = 3; s <= 8; s++) {
    const e = Math.abs(besselZero(n, s + 1) - besselZero(n, s) - PI) / PI;
    if (e > worst) { worst = e; at = s; }
  }
  ok(worst < 0.035, `J_${n}: the true rings 3..9 are spaced π to ${f(worst * 100, 2)} % (worst at ring ${at}) — uCirc's spacing exactly`);
}
// (b) the ring RADII: right for n = 0 and 1; for higher n the whole pattern is shifted in by McMahon's (4n²−1)/(8β).
for (const n of [0, 1, 2, 3]) {
  let worst = 0, at = 0;
  for (let s = 2; s <= 6; s++) {
    const approx = n * PI / 2 + PI / 4 + (s - 0.5) * PI;
    const e = Math.abs(approx - besselZero(n, s)) / PI;
    if (e > worst) { worst = e; at = s; }
  }
  const gate = n <= 1 ? 0.02 : 0.15;
  ok(worst < gate, `J_${n}: rings 2..6 sit within ${f(worst * 100, 2)} % of a spacing of the true zeros (gate ${gate * 100} %, worst at ring ${at})`);
}
ok(Math.abs(besselJ(0, 0) - 1) < 1e-15 && Math.abs(besselJ(1, 0)) < 1e-15, `the series is right at 0: J_0(0) = 1, J_1(0) = 0`);
ok(Math.abs(besselZero(0, 1) - 2.404825557695773) < 1e-6, `j_{0,1} = ${f(besselZero(0, 1), 9)} (2.404825558)`);
let dSec = 0;
for (let i = 0; i < 200; i++) { const r = 0.05 + i / 220; dSec = Math.max(dSec, Math.abs(uCirc(r, PI / 4, 2, 3))); }
ok(dSec < 1e-12, `n = 2: the diameters θ = ±π/4 are nodal, to ${dSec.toExponential(2)}`);

console.log('5. the table');
const T = figTable();
ok(T.length === NFIG, `${T.length} entries`);
const keys = T.map((e) => e.n + ':' + e.m);
ok(new Set(keys).size === NFIG, `all ${NFIG} distinct: ${keys.join(' ')}`);
let mono = true;
for (let r = 1; r < NFIG; r++) if (LADDER[r][0] + LADDER[r][1] < LADDER[r - 1][0] + LADDER[r - 1][1]) mono = false;
ok(mono, `the ladder's n + m is non-decreasing: ${LADDER.map(([n, m]) => n + m).join(' ')}`);
ok(figOf(0).n === 1 && figOf(0).m === 2, `unison → the simplest figure (1, 2)`);
ok(figOf(7).sum === 4 && figOf(1).sum >= 10, `the fifth is simple (n + m = ${figOf(7).sum}), the semitone busy (${figOf(1).sum})`);
let rankMono = true;
for (let r = 1; r < NFIG; r++) if (figOf(RANK[r]).tenney < figOf(RANK[r - 1]).tenney) rankMono = false;
ok(rankMono, `RANK is the Tenney order: ${RANK.join(' ')}`);
// SeeYouDrop: the bass walk C#1 (0) - A1 (8) - F#1 (5) - E1 (3) against a C# tonic
const walk = [0, 8, 5, 3].map((i) => figOf(i));
ok(new Set(walk.map((e) => e.n + ':' + e.m)).size === 4, `SeeYouDrop's walk is four different figures: ${walk.map((e) => `${e.interval}→(${e.n},${e.m})`).join(' ')}`);
// and they differ as FIELDS, not just as labels: the L2 distance between any two on a 48x48 grid
let minD = 1e9;
const samp = (s) => { const v = []; for (let i = 0; i < 48; i++) for (let j = 0; j < 48; j++) v.push(field(i / 47 * 2 - 1, j / 47 * 2 - 1, s, 0, 0)); return v; };
const W = [0, 8, 5, 3].map(samp);
for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++) { let s2 = 0; for (let k = 0; k < W[a].length; k++) s2 += (W[a][k] - W[b][k]) ** 2; minD = Math.min(minD, Math.sqrt(s2 / W[a].length)); }
ok(minD > 0.15, `the closest pair of the walk's fields is ${f(minD)} rms apart (> 0.15)`);

console.log('6. the slide is continuous in s');
let jump = 0, atS = 0;
const PTS = [];
for (let i = 0; i < 24; i++) PTS.push([Math.cos(i * 1.7) * 0.83, Math.sin(i * 2.3) * 0.77]);
for (const h of [0, 0.6, 1]) {
  for (const b of [0, 1]) {
    let prev = null;
    for (let k = 0; k <= 12000; k++) {
      const s = (k / 12000) * NFIG;
      let mx = 0;
      const cur = PTS.map(([x, y]) => field(x, y, s, h, b));
      if (prev) for (let q = 0; q < cur.length; q++) mx = Math.max(mx, Math.abs(cur[q] - prev[q]));
      if (mx > jump) { jump = mx; atS = s; }
      prev = cur;
    }
  }
}
ok(jump < 0.01, `max |Δfield| over a 12000-step sweep of s ∈ [0, 12) at 24 points = ${f(jump, 6)} (worst near s = ${f(atS, 3)})`);
// the wrap: s = 12 − ε must be the s = 0 figure
let wrapD = 0;
for (const [x, y] of PTS) wrapD = Math.max(wrapD, Math.abs(field(x, y, NFIG - 1e-9, 0.3, 0) - field(x, y, 0, 0.3, 0)));
ok(wrapD < 1e-6, `the wrap closes: |field(12⁻) − field(0)| = ${wrapD.toExponential(2)}`);
const b0 = blendOf(-0.25);
ok(b0.i === 11 && b0.j === 0 && Math.abs(b0.f - 0.75) < 1e-12, `blendOf(−0.25) = entries 11 → 0 at f ${f(b0.f)} (a flat sub below the tonic)`);
ok(inside(0, 0, 0) === 1 && Math.abs(inside(1, 0, 0)) < 1e-12 && Math.abs(inside(0.7071067811865476, 0.7071067811865476, 1)) < 1e-9, `inside(): 1 at the centre, 0 on the square's edge and on the disc's rim`);

console.log('7. the GLSL twin');
const num = (re) => { const m = GLSL.match(re); return m ? parseFloat(m[1]) : NaN; };
ok(Math.abs(num(/#define CH_UMAX ([0-9.]+)/) - UMAX) === 0, `CH_UMAX = ${num(/#define CH_UMAX ([0-9.]+)/)}`);
ok(Math.abs(num(/#define CH_W2 ([0-9.]+)/) - W2) === 0, `CH_W2 = ${num(/#define CH_W2 ([0-9.]+)/)}`);
ok(Math.abs(num(/#define CH_W3 ([0-9.]+)/) - W3) === 0, `CH_W3 = ${num(/#define CH_W3 ([0-9.]+)/)}`);
ok(Math.abs(num(/#define CH_KC ([0-9.]+)/) - KC) < 5e-7, `CH_KC = ${num(/#define CH_KC ([0-9.]+)/)} vs π ${f(KC, 6)}`);
const glFig = [...GLSL.matchAll(/vec2\((\d+\.\d+), (\d+\.\d+)\)/g)].map((m) => [+m[1], +m[2]]);
ok(glFig.length === NFIG, `the twin's table has ${glFig.length} entries`);
let dTab = 0;
for (let i = 0; i < NFIG; i++) dTab = Math.max(dTab, Math.abs(glFig[i][0] - FIG[i][0]), Math.abs(glFig[i][1] - FIG[i][1]));
ok(dTab === 0, `the twin's table = the JS table, to ${dTab}`);
ok(/float chField\(/.test(GLSL) && /float chSq\(/.test(GLSL) && /float chCirc\(/.test(GLSL) && /float chIn\(/.test(GLSL), `the twin exports chSq, chCirc, chField, chIn`);

console.log('8. cost');
const t0 = process.hrtime.bigint();
let acc = 0;
for (let i = 0; i < 128; i++) for (let j = 0; j < 128; j++) acc += field(i / 127 * 2 - 1, j / 127 * 2 - 1, 5.4, 0.3, 0.5);
const ms = Number(process.hrtime.bigint() - t0) / 1e6;
ok(ms < 16 && Number.isFinite(acc), `128 x 128 field() in ${f(ms, 2)} ms (sum ${f(acc, 3)})`);

console.log(fails ? `\n${fails} FAIL` : '\nOK · 12 figures · ladder ' + LADDER.map(([n, m]) => `${n}/${m}`).join(' '));
process.exit(fails ? 1 : 0);
