// POLYTOPE (v0.9) — node tests for the parts that are pure arithmetic: the onset detector, the trains and the bump
// profile of grooves.js, and (from step 3) the pole-safety bound of dance.js. No DOM, no GL.
//   node tools/test_polytope.js
import * as GR from '../assets/scenes/polytope/grooves.js';
import { clampXW, XWMAX, OMEGA, KICK_XY, SWEEPB, SWEEP_MIN, SWEEPTOL, hit as daHit, reset as daReset, step as daStep, sweepAngle, sweepFire, sweepProgress } from '../assets/scenes/polytope/dance.js';
import { GATE, get4, poleMargin, rotate4, sweepTarget } from '../assets/scenes/polytope/poly4.js';

let fails = 0;
const ok = (c, m, extra) => { console.log((c ? '  ok ' : '  FAIL ') + m + (extra === undefined ? '' : ' — ' + extra)); if (!c) fails++; };
const near = (a, b, e) => Math.abs(a - b) <= e;

// ---------------------------------------------------------------- 1. the detector
console.log('1. onset detector: a rise over the 0.4 s mean, refractory one 16th, the drum a vote');
{
  GR.train(null);
  GR.reset();
  const dt = 1 / 60;
  // a 4-on-the-floor bass: a 3-frame spike of 0.9 on every beat, silence between; no drums at all
  let launches = 0;
  for (let f = 0; f < 60 * 8; f++) {
    const beat = f * dt * 2;                       // 120 bpm: 2 beats per second
    const inSpike = Math.abs(beat - Math.round(beat)) < 0.03;
    const before = GR.info(beat).bass.n;
    GR.step(dt, [inSpike ? 0.9 : 0, 0, 0], [0, 0, 0], beat, false, 0.9);
    launches += GR.info(beat).bass.n - before;
  }
  ok(launches >= 14 && launches <= 18, 'a 3-frame spike per beat over 8 s files one entry per beat', launches + ' entries in 16 beats');
  const I = GR.info(16);
  ok(I.bass.last.drum === 0, 'no kick → the drum vote did not fire', 'amp ' + I.bass.last.amp);
  ok(near(I.bass.last.amp, 0.9 * GR.VOTE, 0.06), 'an unconfirmed rise is scaled by VOTE', I.bass.last.amp + ' vs ' + (0.9 * GR.VOTE).toFixed(3));
}
{
  GR.reset();
  const dt = 1 / 60;
  // the same, with the kick firing on the same frame: the vote lands and the amplitude is full
  for (let f = 0; f < 60 * 4; f++) {
    const beat = f * dt * 2;
    const inSpike = Math.abs(beat - Math.round(beat)) < 0.03;
    GR.step(dt, [inSpike ? 0.9 : 0, 0, 0], [inSpike ? 1 : 0, 0, 0], beat, false, 0.9);
  }
  const I = GR.info(8);
  ok(I.bass.last.drum === 1, 'kick on the same frame → the vote fires');
  ok(I.bass.last.amp > 0.8, 'a confirmed rise keeps its full amplitude', I.bass.last.amp);
}
{
  GR.reset();
  const dt = 1 / 60;
  // a level that rises and stays high files ONCE: the mean catches up, so there is no second rise
  for (let f = 0; f < 60 * 4; f++) GR.step(dt, [f > 30 ? 0.9 : 0, 0, 0], [0, 0, 0], f * dt * 2, false, 0.9);
  ok(GR.info(8).bass.n === 1, 'a step that stays up files one entry, not a stream', GR.info(8).bass.n);
}
{
  GR.reset();
  // the refractory: two spikes a 32nd apart file one entry
  const dt = 1 / 60;
  for (let f = 0; f < 20; f++) GR.step(dt, [f === 3 || f === 5 ? 0.9 : 0, 0, 0], [0, 0, 0], f * dt * 2, false, 0.9);
  ok(GR.info(1).bass.n === 1, 'two spikes inside one 16th file one entry', GR.info(1).bass.n);
}
{
  GR.reset();
  const dt = 1 / 60;
  // gridTrust high → the launch beat is a multiple of a 16th
  for (let f = 0; f < 60; f++) GR.step(dt, [f === 17 ? 0.9 : 0, 0, 0], [0, 0, 0], f * dt * 2, false, 0.9);
  const b = GR.info(2).bass.last.beat;
  ok(near(b * 4 - Math.round(b * 4), 0, 1e-6), 'gridTrust 0.9 snaps the launch to the nearest 16th', b);
  GR.reset();
  for (let f = 0; f < 60; f++) GR.step(dt, [f === 17 ? 0.9 : 0, 0, 0], [0, 0, 0], f * dt * 2, false, 0.1);
  const b2 = GR.info(2).bass.last.beat;
  ok(Math.abs(b2 * 4 - Math.round(b2 * 4)) > 1e-6, 'gridTrust 0.1 leaves the launch where it fell', b2);
}
{
  GR.reset();
  const dt = 1 / 60;
  // silence + a beat event once a bar → the faint bass entry, so a drumless track still breathes
  for (let f = 0; f < 60 * 10; f++) {
    const beat = f * dt * 2;
    GR.step(dt, [0, 0, 0], [0, 0, 0], beat, Math.abs(beat - Math.round(beat)) < 0.02 && f > 0, 0.9);
  }
  ok(GR.info(20).bass.n >= 3, 'silence: the beat files a faint entry about once a bar', GR.info(20).bass.n);
  ok(near(GR.info(20).bass.last.amp, GR.FAINT, 1e-3), 'and it carries FAINT', GR.info(20).bass.last.amp);
}

// ---------------------------------------------------------------- 2. the trains
console.log('2. the pinned trains: 4x4 evenly spaced along the edge, sync uneven');
for (const [mode, want] of [['4x4', 0.25], ['sync', null]]) {
  GR.train(mode);
  for (let f = 0; f < 60 * 12; f++) GR.step(1 / 60, [0, 0, 0], [0, 0, 0], f / 60 * 2, false, 0.9);
  const beat = 24;
  GR.step(1 / 60, [0, 0, 0], [0, 0, 0], beat, false, 0.9);
  const p = [...new Set(GR.positions(0, beat).map((x) => +x.toFixed(3)))].sort((a, b) => a - b);
  const gaps = p.map((x, i) => (i ? x - p[i - 1] : x + 1 - p[p.length - 1]));
  if (want) {
    ok(p.length === 4, mode + ': four distinct bumps along the edge', JSON.stringify(p));
    ok(gaps.every((g) => near(g, want, 0.03)), mode + ': the gaps are 0.25 ± 0.03', JSON.stringify(gaps.map((g) => +g.toFixed(3))));
  } else {
    ok(p.length === 4, mode + ': four distinct bumps along the edge', JSON.stringify(p));
    ok(gaps.some((g) => Math.abs(g - 0.25) > 0.05), mode + ': the gaps are NOT all 0.25', JSON.stringify(gaps.map((g) => +g.toFixed(3))));
  }
}
GR.train(null);

// ---------------------------------------------------------------- 3. the bump profile
console.log('3. the bump profile along an edge is exact at the subdivision points');
{
  GR.train('4x4');
  for (let f = 0; f < 60 * 12; f++) GR.step(1 / 60, [0, 0, 0], [0, 0, 0], f / 60 * 2, false, 0.9);
  const beat = 24;
  // the resolution that matters is the one the scene actually draws with: sub = 8 at the top tier
  for (const nsub of [8, 32]) {
    const out = new Float32Array(3 * (nsub + 1));
    GR.fillProfile(out, nsub, beat);
    const row = Array.from(out.slice(0, nsub + 1));
    const peaks = [];
    for (let k = 1; k < nsub; k++) if (row[k] > row[k - 1] && row[k] >= row[k + 1] && row[k] > 0.2 * Math.max(...row)) peaks.push(k / nsub);
    ok(peaks.length >= 3, 'sub ' + nsub + ': the 4x4 profile peaks where each of the four bumps sits', JSON.stringify(peaks.map((x) => +x.toFixed(3))));
    ok(Math.min(...row) < 0.55 * Math.max(...row), 'sub ' + nsub + ': and dips between them (the four read as four)', 'min/max ' + (Math.min(...row) / Math.max(...row)).toFixed(3));
    ok(row.every((x) => x >= 0 && x < 4), 'sub ' + nsub + ': the profile stays finite and non-negative', 'max ' + Math.max(...row).toFixed(3));
  }
  // ink is conserved across a tier flip: the mean of the profile barely moves when sub changes (cuts: 'continuous')
  // k = 0 and k = nsub are the SAME point on the edge parameter, so the mean runs over 0…nsub-1
  const mean = (n) => { const o = new Float32Array(3 * (n + 1)); GR.fillProfile(o, n, beat); let s2 = 0; for (let k = 0; k < n; k++) s2 += o[k]; return s2 / n; };
  const m3 = mean(3), m8 = mean(8);
  ok(Math.abs(m3 - m8) / m8 < 0.06, 'the ink under the bumps survives a tier flip 3 ↔ 8', 'sub3 ' + m3.toFixed(4) + ' sub8 ' + m8.toFixed(4));
  const empty = new Float32Array(3 * 9);
  GR.reset();
  GR.fillProfile(empty, 8, 1000);
  ok(empty.every((x) => x === 0), 'an expired train paints nothing');
  GR.train(null);
}

// ---------------------------------------------------------------- 4. pole safety
console.log('4. the xw excursion moves no vertex\'s den by more than XWMAX (dance.js POLE SAFETY)');
{
  ok(clampXW(9) === XWMAX && clampXW(-9) === -XWMAX && clampXW(0.01) === 0.01, 'clampXW caps the excursion at ±XWMAX', XWMAX);
  let worstMove = 0, worstGated = 0;
  for (let i = 0; i < 200; i++) {
    const a1 = i * 0.3173, a2 = i * 0.2111;
    const exc = clampXW((i % 2 ? 1 : -1) * (0.05 + 0.9 * ((i * 0.37) % 1)));
    for (const kind of ['tess', 'c24', 'c600', 'c120']) {
      const P = get4(kind);
      rotate4(P, a1, a2, 0);
      const base = Float64Array.from({ length: P.N }, (_, v) => 1 - P.R[v * 4 + 3]);
      rotate4(P, a1, a2, exc);
      for (let v = 0; v < P.N; v++) {
        const d = 1 - P.R[v * 4 + 3];
        worstMove = Math.max(worstMove, Math.abs(d - base[v]));
        // the theorem's consequence: a vertex comfortably outside the gate is never put inside it
        if (base[v] > GATE + XWMAX && d <= GATE) worstGated++;
      }
    }
  }
  ok(worstMove <= XWMAX + 1e-9, 'over 200 rotations × 4 polytopes no den moved by more than XWMAX', 'worst |Δden| ' + worstMove.toFixed(5) + ' vs ' + XWMAX);
  ok(worstGated === 0, 'and no vertex outside GATE + XWMAX was ever put inside the gate', worstGated + ' violations');
  // the premise the brief assumed, measured: three of the four polytopes DO reach the pole on xy/zw alone
  const mins = ['tess', 'c24', 'c600', 'c120'].map((k) => {
    const P = get4(k);
    let m = 9;
    for (let i = 0; i < 200; i++) { rotate4(P, i * 0.0973, i * 0.1361, 0); m = Math.min(m, poleMargin(P)); }
    return k + ' ' + m.toFixed(4);
  });
  ok(true, 'min den under the xy/zw rotation alone (why the brief\'s clamp is not writable)', mins.join(' · '));
}

// ---------------------------------------------------------------- 5. the nudge
console.log('5. the critically damped nudge overshoots and settles to exactly zero net');
{
  daReset();
  daHit(0, 1);
  const IN = { turnT: 0, zwT: 0, flowHigh: 0, bass: 0, slow: 0, beatPhase: 0, barPos: 0, sweep: 0 };
  let peak = 0, peakT = 0;
  for (let f = 1; f <= 120; f++) {
    const U = daStep(1 / 60, IN);
    if (Math.abs(U.nudge1) > Math.abs(peak)) { peak = U.nudge1; peakT = f / 60; }
  }
  const end = daStep(1 / 60, IN).nudge1;
  ok(Math.abs(peak - KICK_XY / (OMEGA * Math.E)) < 0.004, 'the peak is KICK_XY/(ω e)', peak.toFixed(4) + ' vs ' + (KICK_XY / (OMEGA * Math.E)).toFixed(4));
  ok(Math.abs(peakT - 1 / OMEGA) < 0.02, 'reached at t = 1/ω', peakT.toFixed(3) + ' s');
  ok(Math.abs(end) < 1e-3, 'and it is back to zero two seconds later (the 16-beat lock holds)', end.toExponential(2));
  ok(peak > 0.1, 'and it is visible: over 0.1 rad at amplitude 1 (lean 13)', peak.toFixed(3) + ' rad');
}

// ---------------------------------------------------------------- 6. the sweep
console.log('6. the inside-out sweep: one beat, a bump with no kink, and it really reaches the pole');
{
  daReset();
  ok(sweepFire(100, 0.8, 0) === 1, 'a sweep is cued');
  ok(sweepFire(100 + SWEEP_MIN - 0.1, 0.8, 0) === 0, 'and refused inside SWEEP_MIN beats', SWEEP_MIN);
  ok(sweepFire(100 + SWEEP_MIN + 0.1, 0.8, 0) === 1, 'but allowed after them');
  ok(sweepFire(100 + SWEEP_MIN + 0.2, 0.8, 1) === 1, 'hooks.sweep() forces one anyway');
  daReset();
  sweepFire(0, 0.8, 0);
  const at = (u) => sweepAngle(u * SWEEPB);
  ok(Math.abs(at(0)) < 1e-12 && Math.abs(at(1)) < 1e-12, 'zero at both ends');
  ok(Math.abs(at(0.5) - 0.8) < 1e-9, 'and the full delta at the half beat', at(0.5).toFixed(6));
  ok(Math.abs(at(0.002) - at(0)) < 2e-4 && Math.abs(at(0.998) - at(1)) < 2e-4, 'with no kink where it joins the drift');
  ok(Math.abs(sweepProgress(0.37 * SWEEPB) - 0.37) < 1e-9 && sweepProgress(5) === 0, 'the progress is the parameter', sweepProgress(0.37 * SWEEPB));
  // and it genuinely carries a vertex through: the polytopes that CAN reach the pole do
  const reach = ['tess', 'c24', 'c600', 'c120'].map((k) => {
    const P = get4(k);
    let worst = 0;
    for (let i = 0; i < 60; i++) {
      const a1 = i * 0.317, a2 = i * 0.211, a3 = i * 0.03;
      rotate4(P, a1, a2, a3 + sweepTarget(P, a1, a2, a3, SWEEPTOL).d);
      worst = Math.max(worst, poleMargin(P));
    }
    return { k, worst };
  });
  for (const r of reach) {
    if (r.k === 'tess') ok(r.worst > GATE, 'the tesseract alone never reaches the gate — its best den is 1 - 1/sqrt2', r.worst.toFixed(4));
    else ok(r.worst < GATE, r.k + ': the sweep always puts a vertex inside the gate (the cell blows up and fades)', 'worst ' + r.worst.toFixed(4));
  }
}

console.log(fails ? 'test_polytope: ' + fails + ' FAIL' : 'test_polytope: OK');
process.exit(fails ? 1 : 0);
