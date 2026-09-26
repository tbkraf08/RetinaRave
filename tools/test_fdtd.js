// MAXWELL's physics gates (brief-maxwell step 1) — a node twin of the two GLSL kernels in
// assets/scenes/maxwell/fdtd.js, on a 64x64 grid, in the same update order and at the same Courant number, plus the
// three gates the scene is committed against. The way tools/test_torus2.js checks attractors.js: every constant the
// twin uses is read back OUT of the emitted GLSL, so a typo in either the shader or the twin shows up here.
//
//   0. the constants agree: COURANT / SRCW / KW / PULSE_A / PULSE_W / the blob cutoff, GLSL vs the JS exports
//   1. div B = 0 to 1e-6 after 500 steps from a point source (the Yee identity, so the H lines are closed)
//   2. energy Sum(eps Ez^2 + Hx^2 + Hy^2) in a closed lossless cavity holds within 1 % over 1000 steps
//   3. the crest of the outgoing ring is at distance d after d/c steps, within 1 cell
//   4. the absorber profile is monotone, zero in the interior, and swallows a pulse (the boundary is not a mirror)
//
// usage: node tools/test_fdtd.js
//        node tools/test_fdtd.js twin <w> <h> <steps>    the GPU-vs-twin comparison of hooks.lab / hooks.energy:
//                                                        the same vacuum + PEC + one pulse, energy after <steps>
import { ABSN, ABSSIG, COURANT, CUT, FS_E, FS_H, KW, PULSE_A, PULSE_W, SRCW, absSigma, energyOf } from '../assets/scenes/maxwell/fdtd.js';

let fails = 0;
const ok = (c, m, extra) => { console.log((c ? '  ok   ' : '  FAIL ') + m + (extra === undefined ? '' : ' — ' + extra)); if (!c) fails++; };
const num = (src, re) => { const m = src.match(re); return m ? +m[1] : NaN; };

// ---------------------------------------------------------------------------------------------------------------
// The twin. Ez at (i, j); Hx at (i, j+1/2); Hy at (i+1/2, j). One substep = stepH then stepE, exactly as draw() runs
// the two passes, with the same neighbour clamping (the H pass clamps forward, the E pass clamps backward) and the
// same perfect-conductor outer wall.
// ---------------------------------------------------------------------------------------------------------------
function mkGrid(w, h) {
  return { w, h, Ez: new Float64Array(w * h), Hx: new Float64Array(w * h), Hy: new Float64Array(w * h) };
}
function stepH(G, S) {
  const { w, h, Ez, Hx, Hy } = G;
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const p = j * w + i, ez = Ez[p];
      Hx[p] -= S * (Ez[Math.min(j + 1, h - 1) * w + i] - ez);
      Hy[p] += S * (Ez[j * w + Math.min(i + 1, w - 1)] - ez);
    }
  }
}
// eps / sig / mir are functions of (i, j) or numbers; src(i, j) is the soft source added to Ez this substep.
function stepE(G, S, eps, sig, mir, src) {
  const { w, h, Ez, Hx, Hy } = G;
  const F = (v) => (typeof v === 'function' ? v : () => v);
  const E = F(eps), Sg = F(sig), M = F(mir), J = F(src || 0);
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const p = j * w + i;
      const hy0 = Hy[j * w + Math.max(i - 1, 0)], hx0 = Hx[Math.max(j - 1, 0) * w + i];
      const curl = (Hy[p] - hy0) - (Hx[p] - hx0);
      const ep = E(i, j), sg = Sg(i, j), a = sg * S / (2 * ep);
      let ez = ((1 - a) / (1 + a)) * Ez[p] + ((S / ep) / (1 + a)) * curl + J(i, j);
      ez *= 1 - M(i, j);
      if (i === 0 || j === 0 || i === w - 1 || j === h - 1) ez = 0;
      Ez[p] = ez;
    }
  }
}
// The divergence of B at the cell corner (i+1/2, j+1/2), which the Faraday update leaves invariant.
function divB(G, i, j) {
  const { w, Hx, Hy } = G;
  return (Hx[j * w + i + 1] - Hx[j * w + i]) + (Hy[(j + 1) * w + i] - Hy[j * w + i]);
}
// A gaussian Ez bump at the centre, the same shape as the shader's lab pulse.
function pulse(G, amp, wd) {
  const { w, h, Ez } = G, cx = (w - 1) / 2, cy = (h - 1) / 2;
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const dx = i - cx, dy = j - cy, q = dx * dx + dy * dy;
      if (q > CUT * CUT * wd * wd) continue;
      Ez[j * w + i] += amp * Math.exp(-q / (2 * wd * wd));
    }
  }
}
// The radius along +x of the outgoing ring's crest, to sub-cell accuracy (a parabola through the three samples
// around the peak), ignoring the residue left behind at the centre.
function crest(G, rmin) {
  const { w, h, Ez } = G, cx = Math.round((w - 1) / 2), cy = Math.round((h - 1) / 2);
  let best = -1, bv = 0;
  for (let i = cx + rmin; i < w - 1; i++) {
    const v = Math.abs(Ez[cy * w + i]);
    if (v > bv) { bv = v; best = i; }
  }
  const a = Math.abs(Ez[cy * w + best - 1]), b = bv, c = Math.abs(Ez[cy * w + best + 1]);
  const den = a - 2 * b + c;
  const sub = Math.abs(den) > 1e-12 ? 0.5 * (a - c) / den : 0;
  return { r: best - cx + sub, v: bv };
}

// The lab configuration both the twin and the page run: vacuum, no absorber, a perfect-conductor wall, one pulse.
export function labRun(w, h, steps, S) {
  const G = mkGrid(w, h);
  pulse(G, PULSE_A, PULSE_W);
  for (let n = 0; n < steps; n++) { stepH(G, S); stepE(G, S, 1, 0, 0, 0); }
  return { G, energy: energyOf(interleave(G), w, h, null) };
}
// the twin's three arrays as one RGBA block, so energyOf() is the same code the page's readback goes through
function interleave(G) {
  const { w, h, Ez, Hx, Hy } = G, px = new Float32Array(4 * w * h);
  for (let p = 0; p < w * h; p++) { px[4 * p] = Ez[p]; px[4 * p + 1] = Hx[p]; px[4 * p + 2] = Hy[p]; }
  return px;
}

// ---------------------------------------------------------------------------------------------------------------
if (process.argv[2] === 'twin') {
  const w = +process.argv[3], h = +process.argv[4], n = +process.argv[5], S = +(process.argv[6] || COURANT);
  const r = labRun(w, h, n, S);
  console.log(JSON.stringify({ w, h, steps: n, S, energy: +r.energy.toFixed(6) }));
  process.exit(0);
}

console.log('0. the constants: the emitted GLSL vs the module exports');
{
  const gCut = num(FS_E, /q > ([\d.]+) \* w \* w/);
  const gSrcw = num(FS_E, /vec2\(uCX\[k\], uCY\[k\]\), ([\d.]+)\)/);
  const gKw = num(FS_E, /uJ \* blob\(gl_FragCoord\.xy, uCtr, ([\d.]+)\)/);
  const gPa = num(FS_E, /src \+= ([\d.]+) \* blob\(gl_FragCoord\.xy, uCtr, [\d.]+\)/);
  const gPw = num(FS_E, /src \+= [\d.]+ \* blob\(gl_FragCoord\.xy, uCtr, ([\d.]+)\)/);
  ok(Math.abs(gCut - CUT * CUT) < 1e-9, 'blob cutoff', gCut + ' = CUT^2 ' + CUT * CUT);
  ok(Math.abs(gSrcw - SRCW) < 1e-9, 'charge blob width SRCW', gSrcw);
  ok(Math.abs(gKw - KW) < 1e-9, 'current-loop width KW', gKw);
  ok(Math.abs(gPa - PULSE_A) < 1e-9 && Math.abs(gPw - PULSE_W) < 1e-9, 'lab pulse', gPa + ' / ' + gPw);
  // the two kernels are the two equations and nothing else: one curl each, one source term each
  ok(/f\.g - uS \* \(ey - ez\)/.test(FS_H) && /f\.b \+ uS \* \(ex - ez\)/.test(FS_H), 'Faraday: the curl of E with the right signs');
  ok(/\(f\.b - hy0\) - \(f\.g - hx0\)/.test(FS_E), 'Ampere: the curl of H');
  // the closed field lines rest on this: Faraday carries NO source, so div H is zero exactly and for ever
  ok(!/blob|uDip|uCA|uJ|uPulse/.test(FS_H), 'Faraday has no source term at all (no magnetic current, so no magnetic charge)');
  ok(/uDip\.x \* \(blob\([^)]*uCtr \+ d[\s\S]*?- blob\([^)]*uCtr - d/.test(FS_E), 'the dipole is a pair of antiparallel z-currents, in the Ampere pass');
  ok(/\(1\.0 - a\) \/ \(1\.0 \+ a\)/.test(FS_E) && /\(uS \/ eps\) \/ \(1\.0 \+ a\)/.test(FS_E), 'the lossy-medium coefficients ca / cb');
}

console.log('1. div B = 0 after 500 steps from a point source (the interior; the clamped edge is not in the identity)');
{
  const G = mkGrid(64, 64);
  let mx0 = 0;
  for (let j = 1; j < 62; j++) for (let i = 1; i < 62; i++) mx0 = Math.max(mx0, Math.abs(divB(G, i, j)));
  for (let n = 0; n < 500; n++) {
    stepH(G, COURANT);
    // a soft oscillating source at an off-centre cell, so the test is not symmetric by accident
    const ph = Math.sin(2 * Math.PI * n / 24);
    stepE(G, COURANT, 1, 0, 0, (i, j) => (i === 26 && j === 34 ? 0.4 * ph : 0));
  }
  let mx = 0, hmx = 0;
  for (let j = 1; j < 62; j++) for (let i = 1; i < 62; i++) mx = Math.max(mx, Math.abs(divB(G, i, j)));
  for (let p = 0; p < 64 * 64; p++) hmx = Math.max(hmx, Math.abs(G.Hx[p]), Math.abs(G.Hy[p]));
  ok(mx0 === 0 && mx < 1e-6, 'max |div B| over the interior after 500 steps', mx.toExponential(3) + ' (max |H| ' + hmx.toFixed(4) + ')');
  ok(hmx > 0.01, 'the field is not trivially zero', 'max |H| ' + hmx.toFixed(4));
}

console.log('2. energy in a closed lossless cavity (sigma 0, perfect-conductor wall) over 1000 steps');
{
  // Two quantities, and the difference between them is the one thing this gate had to learn (see the report):
  //   NAIVE  = Sum(eps Ez_n^2 + Hx_{n+1/2}^2 + Hy_{n+1/2}^2)  — the brief's expression. E and H live half a step
  //            apart in a leapfrog, so this is not an invariant of the scheme: it RIPPLES at the local wave
  //            frequency with an amplitude of order S, and its drift (the mean over a window) is what "no energy is
  //            created or destroyed" actually means.
  //   EXACT  = Sum(eps Ez_n^2 + Hx_{n-1/2} Hx_{n+1/2} + Hy_{n-1/2} Hy_{n+1/2})  — the Yee scheme's own discrete
  //            energy, the H term taken as the product of the two half steps. THIS is conserved identically.
  const G = mkGrid(64, 64);
  pulse(G, PULSE_A, PULSE_W);
  const n2 = G.w * G.h;
  const pX = new Float64Array(n2), pY = new Float64Array(n2);
  const naive = [], exact = [];
  for (let n = 0; n < 1000; n++) {
    pX.set(G.Hx); pY.set(G.Hy);
    stepH(G, COURANT);
    let a = 0, b = 0;
    for (let p = 0; p < n2; p++) {
      a += G.Ez[p] * G.Ez[p] + G.Hx[p] * G.Hx[p] + G.Hy[p] * G.Hy[p];
      b += G.Ez[p] * G.Ez[p] + pX[p] * G.Hx[p] + pY[p] * G.Hy[p];
    }
    naive.push(a); exact.push(b);
    stepE(G, COURANT, 1, 0, 0, 0);
  }
  const mean = (a, i, j) => a.slice(i, j).reduce((s, x) => s + x, 0) / (j - i);
  const w0 = exact[0], wlo = Math.min(...exact), whi = Math.max(...exact);
  ok((whi - wlo) / w0 < 1e-8, 'EXACT: the Yee energy over 1000 steps, (max - min) / W(0)', ((whi - wlo) / w0).toExponential(3) + '  (W ' + w0.toFixed(6) + ')');
  const d = Math.abs(mean(naive, 900, 1000) - mean(naive, 0, 100)) / mean(naive, 0, 100);
  const band = (Math.max(...naive) - Math.min(...naive)) / mean(naive, 0, 100);
  ok(d < 0.01, 'NAIVE: drift of its 100-step mean, last window vs first', (100 * d).toFixed(4) + ' %');
  console.log('       NAIVE ripple band (max - min) / mean = ' + (100 * band).toFixed(2) + ' % — the leapfrog half-step, not a leak');
}

console.log('3. the front travels at c: the crest advances S cells per step (a well-resolved pulse)');
{
  // A narrow pulse is the wrong instrument: at width 1.2 cells the spectrum reaches the Nyquist cell, where the Yee
  // scheme's numerical dispersion is worst, and the crest lags badly (measured: 0.426 cells per step instead of 0.5).
  // The gate is therefore run on the SAME well-resolved gaussian the lab pulse uses (PULSE_W = 3 cells). Its crest
  // starts about one bump-width ahead of the ideal point-source front — a constant offset, not an error that grows —
  // so the moving claim ("distance d after d/c steps") is read off the ADVANCE from the first sample.
  const G = mkGrid(257, 257);
  pulse(G, PULSE_A, PULSE_W);
  const want = [40, 80, 120, 160];
  const rows = [], rs = {};
  for (let n = 1, k = 0; n <= want[want.length - 1]; n++) {
    stepH(G, COURANT);
    stepE(G, COURANT, 1, 0, 0, 0);
    if (n === want[k]) {
      const c = crest(G, 4);
      rs[n] = c.r;
      rows.push('n' + n + ' r' + c.r.toFixed(2) + ' (nS ' + (n * COURANT) + ', offset ' + (c.r - n * COURANT).toFixed(2) + ')');
      k++;
    }
  }
  let worst = 0;
  for (const n of want.slice(1)) worst = Math.max(worst, Math.abs((rs[n] - rs[40]) - (n - 40) * COURANT));
  ok(worst <= 1, 'worst |advance - (n - 40) S| in cells', worst.toFixed(3) + '  [' + rows.join('  ') + ']');
  const sp = (rs[160] - rs[40]) / 120;
  ok(Math.abs(sp - COURANT) < 0.02 * COURANT, 'the measured speed over 120 steps vs S', sp.toFixed(4) + ' vs ' + COURANT);
}

console.log('4. the graded absorber: monotone to the edge, zero in the interior, and it swallows the pulse');
{
  const w = 96, h = 96;
  let mono = true;
  for (let d = 0; d < ABSN; d++) if (absSigma(d, 48, w, h) < absSigma(d + 1, 48, w, h)) mono = false;
  ok(mono, 'sigma falls monotonically inward over the ' + ABSN + ' absorber cells', 'edge ' + absSigma(0, 48, w, h).toFixed(3) + ' → ' + absSigma(ABSN, 48, w, h).toFixed(3));
  ok(absSigma(48, 48, w, h) === 0 && Math.abs(absSigma(0, 48, w, h) - ABSSIG) < 1e-12, 'zero in the interior, ABSSIG at the outermost cell');
  const A = mkGrid(w, h), B = mkGrid(w, h);
  pulse(A, PULSE_A, PULSE_W);
  pulse(B, PULSE_A, PULSE_W);
  const sg = (i, j) => absSigma(i, j, w, h);
  for (let n = 0; n < 400; n++) {
    stepH(A, COURANT); stepE(A, COURANT, 1, sg, 0, 0);
    stepH(B, COURANT); stepE(B, COURANT, 1, 0, 0, 0);
  }
  const eA = energyOf(interleave(A), w, h, null), eB = energyOf(interleave(B), w, h, null);
  ok(eA < 0.2 * eB, 'after 400 steps the absorbing cavity holds under a fifth of the mirrored one', 'absorber ' + eA.toExponential(3) + ' vs mirror ' + eB.toFixed(4));
}

console.log('test_fdtd: ' + (fails ? fails + ' FAIL' : 'OK'));
process.exit(fails ? 1 : 0);
