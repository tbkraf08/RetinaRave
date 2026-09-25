// NAV2's navigator driven in node for 48 s at 60 Hz, off a re-implementation of the few lines of the fake timeline
// (assets/engine/sources/fake.js) that it reads, with the continuity monitor's rule (tools/monitor.js) re-implemented
// here. NAV could never be tested in node — it needs the exterior ray grid, which needs a Worker. NAV2 is chart-free,
// so it can be, and this is the proof that its continuity invariant holds by construction, not by a screenshot.
// node tools/test_nav2.js            N2TRACE=1 prints one line per half second
import scene from '../assets/scenes/nav2/index.js';
import { N2, resetNav2, updateNav2, V_MAX } from '../assets/scenes/nav2/nav2.js';
import { resetDet, updateDet, DET } from '../assets/scenes/nav2/detect.js';
import { clamp, ema } from '../assets/math/util.js';

let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL ' + m); } else console.log('  ok   ' + m); };

const MS = {
  presence: 0, bass: 0, mid: 0, high: 0, hit: 0, hitStrength: 0, beat: false, beatPhase: 0, beatCount: 0, bpm: 124,
  eS: 0, eM: 0, build: 0, tension: 0, arc: 'idle', dropEvt: false, dropStrength: 0, dropEnv: 0, resolveEvt: false,
  centroid: 0, flux: 0, hush: 0, flow: 0, kick: 0, lvl: 0, riser: 0, roll: 0, hp: 0, onsetRate: 0,
  dropExpectedIn: -1, fakeoutEvt: false, peaks: [[110, 1], [220, 0.6], [330, 0.5], [550, 0.3]],
  seed: { hue: 0.6, th: -0.29, a: 0.17, scene: -1 },
};

// The lines of sources/fake.js that NAV2 reads, verbatim in behaviour (24 s loop, DROP at 13 s).
function fake(S, dt, now) {
  const T = now % 24;
  S.dropEvt = S.resolveEvt = S.fakeoutEvt = S.beat = false;
  S.presence = 1;
  const sec = T < 6 ? 'sustain' : T < 10 ? 'valley' : T < 13 ? 'build' : T < 21 ? 'peak' : 'valley';
  const kickOn = sec === 'sustain' || sec === 'peak';
  S.beatPhase += dt * S.bpm / 60;
  if (S.beatPhase >= 1) {
    S.beatPhase -= 1;
    S.beatCount++;
    S.beat = true;
    if (kickOn) {
      S.hitStrength = 0.8;
      S.hit = 1;
    }
  }
  S.hit *= Math.exp(-dt / 0.14);
  const kp = kickOn ? Math.exp(-S.beatPhase * 5) : 0;
  S.bass = kp * 0.9;
  S.mid = sec === 'valley' ? 0.25 : 0.55;
  S.high = sec === 'build' ? 0.3 + 0.2 * (T - 10) : 0.35;
  const e = clamp(0.5 * S.bass + 0.35 * S.mid + 0.15 * S.high + (kickOn ? 0.25 : 0), 0, 1);
  S.eS = ema(S.eS, e, dt, 0.3);
  S.eM = ema(S.eM, e, dt, 2.5);
  S.build = ema(S.build, sec === 'build' ? 1 : 0, dt, 1);
  S.tension = ema(S.tension, sec === 'build' ? 0.9 : sec === 'peak' ? 0.6 : 0.2, dt, 0.5);
  if (sec !== S.arc) {
    if (sec === 'peak') {
      S.dropEvt = true;
      S.dropStrength = 0.9;
      S.dropEnv = 1;
      S.build = 0;
    }
    S.arc = sec;
  }
  S.dropEnv *= Math.exp(-dt / 1.1);
  S.kick = S.beat && kickOn ? 1 : S.kick * Math.exp(-dt / 0.16);
  S.lvl = e;
  S.hush = sec === 'build' && T > 12.6 ? 1 : 0;
  S.flow += dt * (0.015 + 0.9 * S.lvl + 0.6 * S.kick + 1.2 * S.dropEnv);
  S.centroid = 0.35 + 0.3 * S.high;
  S.flux = kp;
  S.dropExpectedIn = sec === 'build' ? (13 - T) * S.bpm / 60 : -1;
  S.riser = S.roll = S.build;
  S.hp = 0;
  S.onsetRate = 0;
}

resetNav2();
resetDet();
const P = {}, dt = 1 / 60, FR = 48 * 60;
const MON = { n: 0, fast: 0, max: 0, viol: [] };
let pc = null, pk = 0, pm = '', pd = 0, tm = -999, intN = 0, intHas = 0, maxStep = 0, maxStepLegal = 0;
const modes = [], events = [];
let cInMin = 9, dropFrame = -1, backFrame = -1, nonFinite = 0;

for (let f = 1; f <= FR; f++) {
  const now = f * dt;
  fake(MS, dt, now);
  for (const k in scene.params) P[k] = scene.params[k].from(MS);
  updateDet(dt, MS, P);
  updateNav2(dt, now, MS, { P, isLogical: true });
  const N = N2, c = [N.cPath[0], N.cPath[1]];
  if (!isFinite(c[0]) || !isFinite(c[1]) || !isFinite(N.rho) || !isFinite(DET.angle)) nonFinite++;
  if (pc) {
    if (N.mode !== pm) {
      tm = f;
      events.push([f, pm + '->' + N.mode]);
      if (pm === 'INT' && dropFrame < 0) dropFrame = f;
      if (N.mode === 'INT' && dropFrame > 0 && backFrame < 0) backFrame = f;
    }
    const d = Math.hypot(c[0] - pc[0], c[1] - pc[1]);
    const legal = N.pathCut <= 2 || N.kick.x > pk + 0.05 || N.mode !== pm || f - tm < 18;
    MON.n++;
    if (legal) maxStepLegal = Math.max(maxStepLegal, d);
    else {
      maxStep = Math.max(maxStep, d);
      MON.max = Math.max(MON.max, d);
      if (d > 0.06) {
        if (d > 2.5 * pd + 0.01) MON.viol.push([f, +d.toFixed(4), +pd.toFixed(4), N.mode]);
        else MON.fast++;
      }
    }
    pd = d;
  }
  pc = c;
  pk = N.kick.x;
  pm = N.mode;
  if (N.mode === 'INT') {
    intN++;
    intHas += N.cyc.has;
    cInMin = Math.min(cInMin, 9);
  }
  if (modes.indexOf(N.mode) < 0) modes.push(N.mode);
  if (process.env.N2TRACE && f % 30 === 0) {
    console.log(`  t ${(now).toFixed(1)} f${f} ${N.mode} c ${c[0].toFixed(4)},${c[1].toFixed(4)} rho ${N.rho.toFixed(4)} q${N.q} has${N.cyc.has}` +
      ` wind ${DET.wind.toFixed(3)} curl ${DET.curl.toFixed(3)} pitch ${DET.pitch.toFixed(3)} lift ${DET.lift.toFixed(4)} spin ${DET.rate.toFixed(3)} dei ${MS.dropExpectedIn.toFixed(2)}`);
  }
}

console.log('48 s at 60 Hz on the fake timeline:');
console.log('  modes seen: ' + modes.join(' ') + '   transitions: ' + events.map((e) => 'f' + e[0] + ' ' + e[1]).join(', '));
ok(nonFinite === 0, 'nothing non-finite in 2880 frames (' + nonFinite + ')');
ok(MON.viol.length === 0, 'continuity monitor: viol ' + JSON.stringify(MON.viol) + ' (n ' + MON.n + ', fast ' + MON.fast + ', max ' + MON.max.toFixed(4) + ')');
ok(intN > 0 && intHas / intN >= 0.98, `has on ${(100 * intHas / intN).toFixed(2)} % of ${intN} INT frames (want >= 98 %)`);
ok(maxStep <= V_MAX * dt + 1e-9, `the largest non-cut step is ${maxStep.toFixed(5)} <= V_MAX*dt ${(V_MAX * dt).toFixed(5)}`);
ok(dropFrame >= 779 && dropFrame <= 781, `the exit is at frame ${dropFrame} (13 s = f780 +- 1)`);
ok(backFrame > 0 && backFrame < 26 * 60, `back inside at frame ${backFrame} (before 26 s = f1560)`);
ok(events.length >= 6, `two drops in 48 s: ${events.length} mode changes`);
ok(N2.cyc.has === 1 || N2.mode !== 'INT', 'the cycle is live at the end (mode ' + N2.mode + ', has ' + N2.cyc.has + ')');
void cInMin;

// Cost: the same 48 s driven again, timed. process.hrtime has nanosecond resolution, so unlike the browser hook this
// sees a single call. The brief's gate is the MEDIAN of 300 update() calls <= 0.5 ms.
{
  resetNav2();
  resetDet();
  const MS2 = JSON.parse(JSON.stringify(MS));
  MS2.peaks = MS.peaks;
  MS2.seed = MS.seed;
  const per = [];
  for (let f = 1; f <= FR; f++) {
    const now = f * dt;
    fake(MS2, dt, now);
    for (const k in scene.params) P[k] = scene.params[k].from(MS2);
    const t0 = process.hrtime.bigint();
    updateDet(dt, MS2, P);
    updateNav2(dt, now, MS2, { P, isLogical: true });
    per.push(Number(process.hrtime.bigint() - t0) / 1e6);
  }
  const sorted = per.slice().sort((a, b) => a - b);
  const med = sorted[sorted.length >> 1], p99 = sorted[Math.floor(sorted.length * 0.99)], mx = sorted[sorted.length - 1];
  const mean = per.reduce((a, b) => a + b, 0) / per.length;
  console.log(`\nupdate() cost over ${FR} frames (node, hrtime): median ${med.toFixed(4)} ms  mean ${mean.toFixed(4)} ms  p99 ${p99.toFixed(4)} ms  max ${mx.toFixed(4)} ms`);
  ok(med <= 0.5, `the median update() is ${med.toFixed(4)} ms (gate 0.5 ms)`);
  ok(mx <= 5, `the worst single update() is ${mx.toFixed(4)} ms`);
}

console.log(fails ? `\ntest_nav2: ${fails} FAIL` : '\ntest_nav2: OK');
process.exit(fails ? 1 : 0);
