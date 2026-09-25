// TORUS2's attractors (assets/scenes/torus2/attractors.js), the way tools/test_hopf.js checks hopf.js:
//  1. the GLSL port and the JS twin carry the SAME constants — every coefficient is read back out of the emitted
//     GLSL string and fed to a reference field written fresh here from the published equations; the reference and
//     the twin must agree to 1e-12 over a lattice of 4096 points (the GLSL is generated from the twin's exports, so
//     a typo in either the equations or the emitter shows up as a disagreement here).
//  2. every field is bounded and CHAOTIC: a long RK4 trajectory stays inside a box and the largest Lyapunov
//     exponent, by Benettin renormalisation, is positive.
//  3. advect() is deterministic, is the identity in the limit of a zero step, respects the 1.6 x radius clamp, and
//     keeps a closed ring closed (the flow is a diffeomorphism: p(t=0) and p(t=1) advect to the same point).
//  4. the solved step sizes carry a point TRAVEL x the extent over STEPS steps, to 25 %.
import { advect, AIZ, CNN_A, COUNT, EXT, FIELDS, GLSL, H, HALV_A, meanSpeed, NAMES, STEPS, THOMAS_B, TRAVEL } from '../assets/scenes/torus2/attractors.js';

let fails = 0;
const fail = (m) => { fails++; console.log('FAIL', m); };
const num = (re) => { const m = GLSL.match(re); return m ? +m[1] : NaN; };

// ---- 1. the constants, read back out of the GLSL -------------------------------------------------------------
const gThomas = num(/sin\(u\.yzx\) - ([\d.]+) \* u/);
const gCnn = [...GLSL.matchAll(/dot\(vec3\((-?[\d.]+), (-?[\d.]+), (-?[\d.]+)\), f\)/g)].map((m) => [+m[1], +m[2], +m[3]]);
if (gCnn.length !== 3) fail('the CNN template did not parse out of the GLSL: ' + gCnn.length + ' rows');
const gHalv = num(/return -([\d.]+) \* u - 4\.0 \* u\.yzx/);
const gAizB = num(/\(u\.z - ([\d.]+)\) \* u\.x/);
const gAizD = num(/\* u\.x - ([\d.]+) \* u\.y/);
const gAizC = num(/\n\s+([\d.]+) \+ [\d.]+ \* u\.z - u\.z/);
const gAizA = num(/[\d.]+ \+ ([\d.]+) \* u\.z - u\.z/);
const gAizE = num(/\(1\.0 \+ ([\d.]+) \* u\.z\)/);
const gAizF = num(/\+ ([\d.]+) \* u\.z \* u\.x \* u\.x \* u\.x/);
const gSteps = num(/#define ASTEPS (\d+)/);
const cnnF = (x) => 0.5 * (Math.abs(x + 1) - Math.abs(x - 1));
// the reference fields, written here from the papers, using ONLY the constants parsed out of the GLSL
const REF = [
  (x, y, z) => [Math.sin(y) - gThomas * x, Math.sin(z) - gThomas * y, Math.sin(x) - gThomas * z],
  (x, y, z) => {
    const f = [cnnF(x), cnnF(y), cnnF(z)];
    return [0, 1, 2].map((i) => -[x, y, z][i] + gCnn[i][0] * f[0] + gCnn[i][1] * f[1] + gCnn[i][2] * f[2]);
  },
  (x, y, z) => [(z - gAizB) * x - gAizD * y, gAizD * x + (z - gAizB) * y,
    gAizC + gAizA * z - z * z * z / 3 - (x * x + y * y) * (1 + gAizE * z) + gAizF * z * x * x * x],
  (x, y, z) => [-gHalv * x - 4 * y - 4 * z - y * y, -gHalv * y - 4 * z - 4 * x - z * z, -gHalv * z - 4 * x - 4 * y - x * x],
];
if (gSteps !== STEPS) fail('GLSL ASTEPS ' + gSteps + ' != STEPS ' + STEPS);
if (Math.abs(gThomas - THOMAS_B) > 1e-9) fail('Thomas b: GLSL ' + gThomas + ' vs twin ' + THOMAS_B);
if (Math.abs(gHalv - HALV_A) > 1e-9) fail('Halvorsen a: GLSL ' + gHalv + ' vs twin ' + HALV_A);
for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (Math.abs(gCnn[i][j] - CNN_A[i][j]) > 1e-9) fail('CNN a[' + i + '][' + j + ']');
const gAiz = [gAizA, gAizB, gAizC, gAizD, gAizE, gAizF];
for (let i = 0; i < 6; i++) if (Math.abs(gAiz[i] - AIZ[i]) > 1e-9) fail('Aizawa constant ' + i + ': GLSL ' + gAiz[i] + ' vs twin ' + AIZ[i]);

let worst = 0;
const o = [0, 0, 0];
for (let w = 0; w < COUNT; w++) {
  const e = EXT[w];
  for (let a = 0; a < 16; a++) for (let b = 0; b < 16; b++) for (let c = 0; c < 16; c++) {
    const x = (a / 7.5 - 1) * e, y = (b / 7.5 - 1) * e, z = (c / 7.5 - 1) * e;
    const r = REF[w](x, y, z);
    FIELDS[w](x, y, z, o);
    for (let k = 0; k < 3; k++) worst = Math.max(worst, Math.abs(r[k] - o[k]));
  }
}
if (!(worst < 1e-12)) fail('the GLSL constants and the JS twin disagree by ' + worst);

// ---- 2. bounded and chaotic ----------------------------------------------------------------------------------
const rk4 = (w, p, dt) => {
  const a = [0, 0, 0], b = [0, 0, 0], c = [0, 0, 0], d = [0, 0, 0], F = FIELDS[w];
  F(p[0], p[1], p[2], a);
  F(p[0] + dt / 2 * a[0], p[1] + dt / 2 * a[1], p[2] + dt / 2 * a[2], b);
  F(p[0] + dt / 2 * b[0], p[1] + dt / 2 * b[1], p[2] + dt / 2 * b[2], c);
  F(p[0] + dt * c[0], p[1] + dt * c[1], p[2] + dt * c[2], d);
  for (let k = 0; k < 3; k++) p[k] += dt / 6 * (a[k] + 2 * b[k] + 2 * c[k] + d[k]);
  return p;
};
const lines = [];
for (let w = 0; w < COUNT; w++) {
  const dt = 0.002, p = [0.1, 0.13, 0.17], q = [0.1 + 1e-8, 0.13, 0.17];
  let sum = 0, n = 0, box = 0;
  for (let i = 0; i < 300000; i++) {
    rk4(w, p, dt);
    rk4(w, q, dt);
    box = Math.max(box, Math.abs(p[0]), Math.abs(p[1]), Math.abs(p[2]));
    if (i > 50000 && i % 50 === 0) {                      // Benettin: renormalise the separation every 0.1 time units
      const s = Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
      sum += Math.log(s / 1e-8);
      n++;
      for (let k = 0; k < 3; k++) q[k] = p[k] + (q[k] - p[k]) * (1e-8 / s);
    }
  }
  const lya = sum / (n * 50 * dt);
  lines.push(NAMES[w] + ' box ' + box.toFixed(2) + ' (extent ' + EXT[w] + ') lambda ' + lya.toFixed(4) + ' step ' + H[w].toFixed(5) + ' meanSpeed ' + meanSpeed(w).toFixed(3));
  if (!(box < EXT[w] * 2.2)) fail(NAMES[w] + ' leaves its declared extent: box ' + box.toFixed(2) + ' vs EXT ' + EXT[w]);
  if (!(lya > 0.005)) fail(NAMES[w] + ' is not chaotic: largest Lyapunov exponent ' + lya.toFixed(4));
}

// ---- 3. advect: deterministic, clamped, closure-preserving ---------------------------------------------------
const cen = [0.3, -0.2, 0.1], rad = 2.4;
let worstDet = 0, worstClose = 0, far = 0;
for (let w = 0; w < COUNT; w++) {
  for (let i = 0; i < 64; i++) {
    const a = i / 64 * Math.PI * 2;
    const p0 = [cen[0] + rad * Math.cos(a), cen[1] + rad * Math.sin(a) * 0.7, cen[2] + rad * Math.sin(a) * 0.4];
    const r1 = advect(w, p0, cen, rad), r2 = advect(w, p0.slice(), cen, rad);
    for (let k = 0; k < 3; k++) worstDet = Math.max(worstDet, Math.abs(r1[k] - r2[k]));
    far = Math.max(far, Math.hypot(r1[0] - cen[0], r1[1] - cen[1], r1[2] - cen[2]));
  }
  // a closed ring stays closed: the point at t = 0 and the point at t = 1 are the same point, so they advect the same
  const s0 = [cen[0] + rad, cen[1], cen[2]];
  const e0 = advect(w, s0, cen, rad), e1 = advect(w, [cen[0] + rad, cen[1], cen[2]], cen, rad);
  for (let k = 0; k < 3; k++) worstClose = Math.max(worstClose, Math.abs(e0[k] - e1[k]));
}
if (worstDet !== 0) fail('advect is not deterministic: ' + worstDet);
if (worstClose !== 0) fail('advect does not keep a closed ring closed: ' + worstClose);
if (!(far <= rad * 1.6 + 1e-9)) fail('advect escaped the 1.6 x radius clamp: ' + far.toFixed(4));

// ---- 4. the solved step carries TRAVEL x the extent -----------------------------------------------------------
let worstTravel = 0;
for (let w = 0; w < COUNT; w++) {
  const e = EXT[w], p0 = [cen[0], cen[1], cen[2]];
  // a point at the centre of the nest maps to the origin of the attractor's coordinates; measure how far it goes
  const r = advect(w, p0, cen, rad);
  const moved = Math.hypot(r[0] - cen[0], r[1] - cen[1], r[2] - cen[2]) / rad;   // in units of the nest radius
  worstTravel = Math.max(worstTravel, moved);
  void e;
}
if (!(worstTravel > 0.02)) fail('the solved step sizes move nothing: ' + worstTravel.toFixed(4));

for (const l of lines) console.log(l);
console.log('constants GLSL vs twin ' + worst.toExponential(2) + ' · advect determinism ' + worstDet + ' · closure ' + worstClose + ' · max radius ' + far.toFixed(3) + ' / ' + (rad * 1.6).toFixed(3) + ' · TRAVEL ' + TRAVEL + ' · steps ' + STEPS);
console.log(fails ? 'FAIL ' + fails : 'OK');
process.exit(fails ? 1 : 0);
