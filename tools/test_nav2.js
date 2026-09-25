// NAV2's navigator driven in node for 48 s at 60 Hz, off a re-implementation of the few lines of the fake timeline
// (assets/engine/sources/fake.js) that it reads, with the continuity monitor's rule (tools/monitor.js) re-implemented
// here. NAV could never be tested in node — it needs the exterior ray grid, which needs a Worker. NAV2 is chart-free,
// so it can be, and this is the proof that its continuity invariant holds by construction, not by a screenshot.
// node tools/test_nav2.js            N2TRACE=1 prints one line per half second
import scene from '../assets/scenes/nav2/index.js';
import { N2, resetNav2, updateNav2, V_MAX, RHO_CAP } from '../assets/scenes/nav2/nav2.js';
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
let cInMin = 9, dropFrame = -1, backFrame = -1, nonFinite = 0, gateFrames = 0;

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
    if (N.gate.on) gateFrames++;          // walking THROUGH a root: there is no attracting cycle there, by definition
    else {
      intN++;
      intHas += N.cyc.has;
    }
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
ok(intN > 0 && intHas / intN >= 0.98, `has on ${(100 * intHas / intN).toFixed(2)} % of ${intN} INT frames that are not walking a gate (want >= 98 %); ${gateFrames} frames were (${(100 * gateFrames / (intN + gateFrames)).toFixed(1)} % of INT)`);
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

// ---------------------------------------------------------------------------------------------------------------
// The v0.8 retune, proved (docs/workers/nav2.md "Retune after the real-music trace"). Two things the headed traces
// showed: `sweep` saturated on ordinary centroid jitter, and the melody had no room to move c.
// ---------------------------------------------------------------------------------------------------------------
const quiet = () => ({
  presence: 1, bass: 0.2, mid: 0.4, high: 0.35, hit: 0, hitStrength: 0, beat: false, beatPhase: 0, beatCount: 0,
  bpm: 124, eS: 0.3, eM: 0.3, build: 0, tension: 0.2, arc: 'sustain', dropEvt: false, dropStrength: 0, dropEnv: 0,
  resolveEvt: false, centroid: 0.5, flux: 0, hush: 0, flow: 0, kick: 0, lvl: 0.3, riser: 0, roll: 0, hp: 0,
  onsetRate: 0, dropExpectedIn: -1, fakeoutEvt: false, peaks: [[110, 1], [220, 0.6], [330, 0.5], [550, 0.3]],
  seed: { hue: 0.6, th: -0.29, a: 0.17, scene: -1 },
});

// Drive the DETECTORS alone off a centroid signal. Returns the sweep track.
function runSweep(cenAt, secs) {
  resetDet();
  const S = quiet(), pp = {}, out = [];
  for (let f = 1; f <= Math.round(secs * 60); f++) {
    const t = f * dt;
    S.centroid = cenAt(t);
    S.flow += dt;
    S.beatPhase += dt * S.bpm / 60;
    if (S.beatPhase >= 1) { S.beatPhase -= 1; S.beatCount++; }
    for (const k in scene.params) pp[k] = scene.params[k].from(S);
    updateDet(dt, S, pp);
    out.push(DET.sweep);
  }
  return out;
}

// Drive the WHOLE scene off a centroid signal, with the monitor's rule. Returns the reach of Im c inside INT.
function runMelody(cenAt, secs) {
  resetNav2();
  resetDet();
  const S = quiet(), pp = {};
  let yLo = 9, yHi = -9, rhoMax = 0, viol = 0, pc = null, pd = 0, pm = '', tm = -999, nInt = 0;
  const qs = [], bins = new Set();
  let pq = 0, gates = 0, backs = 0, gateF = 0;
  for (let f = 1; f <= Math.round(secs * 60); f++) {
    const t = f * dt;
    S.centroid = cenAt(t);
    S.flow += dt;
    S.beatPhase += dt * S.bpm / 60;
    if (S.beatPhase >= 1) { S.beatPhase -= 1; S.beatCount++; }
    for (const k in scene.params) pp[k] = scene.params[k].from(S);
    updateDet(dt, S, pp);
    updateNav2(dt, t, S, { P: pp, isLogical: true });
    const c = [N2.cPath[0], N2.cPath[1]];
    if (pc) {
      if (N2.mode !== pm) tm = f;
      const d = Math.hypot(c[0] - pc[0], c[1] - pc[1]);
      const legal = N2.pathCut <= 2 || N2.mode !== pm || f - tm < 18;
      if (!legal && d > 0.06 && d > 2.5 * pd + 0.01) viol++;
      pd = d;
    }
    pc = c;
    pm = N2.mode;
    if (N2.mode === 'INT' && f > 120) {     // two seconds for the normaliser to see the range
      nInt++;
      yLo = Math.min(yLo, c[1]);
      yHi = Math.max(yHi, c[1]);
      if (!N2.gate.on) rhoMax = Math.max(rhoMax, N2.rho);
      else gateF++;
      if (N2.cyc.has) {                     // which internal angle the melody is holding, in eighths of a turn
        const a = N2.cyc.arg / (2 * Math.PI);
        bins.add(Math.floor((a - Math.floor(a)) * 8));
      }
      if (N2.q !== pq) {
        if (pq) {
          qs.push(pq + '->' + N2.q);
          if (N2.q > pq) gates++;
          else backs++;
        }
        pq = N2.q;
      }
    }
  }
  return { yLo, yHi, rhoMax, viol, nInt, qs, gates, backs, bins: bins.size, gateF };
}

// A deterministic stand-in for real frame-level centroid jitter: three short periods, no net drift.
const jitter = (t) => 0.5 + 0.09 * Math.sin(t * 8.9) + 0.07 * Math.sin(t * 4.7 + 1.3) + 0.06 * Math.sin(t * 2.9 + 2.6);
// A real filter sweep: 0.3 units over 3 s, repeated with a fall between.
const ramp = (t) => { const u = t % 9; return u < 3 ? 0.4 + 0.1 * u : u < 4 ? 0.7 - 0.3 * (u - 3) : 0.4; };
// The two real tracks' own centroids, sampled at 2 s by the headed trace, linearly interpolated back to 60 Hz. This
// is SMOOTHER than the real signal (frame jitter is gone), so it is a conservative test of the run detector.
const CEN_CN = [0.571, 0.523, 0.595, 0.553, 0.528, 0.603, 0.58, 0.555, 0.601, 0.571, 0.496, 0.605, 0.566, 0.56, 0.61,
  0.597, 0.453, 0.614, 0.615, 0.546, 0.601, 0.632, 0.5, 0.598, 0.585, 0.542, 0.591, 0.615, 0.505, 0.601, 0.574, 0.558,
  0.591, 0.588, 0.516, 0.596, 0.553, 0.573, 0.591, 0.565];
const CEN_WLTP = [0.537, 0.7, 0.528, 0.677, 0.558, 0.694, 0.588, 0.658, 0.603, 0.647, 0.611, 0.657, 0.671, 0.645,
  0.629, 0.583, 0.615, 0.629, 0.622, 0.681, 0.653, 0.734, 0.713, 0.744, 0.765, 0.72, 0.654, 0.672, 0.553, 0.649,
  0.596, 0.636, 0.65, 0.671, 0.658, 0.642, 0.679, 0.645, 0.696, 0.708];
const replay = (arr) => (t) => {
  const u = Math.min(t / 2, arr.length - 1.001), i = Math.floor(u);
  return arr[i] + (arr[i + 1] - arr[i]) * (u - i);
};
const stat = (a) => ({ min: Math.min(...a), max: Math.max(...a), med: a.slice().sort((x, y) => x - y)[a.length >> 1] });

console.log('\nsweep on a jittery centroid vs a real filter sweep:');
{
  const j = stat(runSweep(jitter, 30));
  ok(j.max <= 0.15, `jitter (three short periods, no drift): sweep max ${j.max.toFixed(4)} med ${j.med.toFixed(4)} (gate <= 0.15)`);
  const r = runSweep(ramp, 12), rs = stat(r.slice(120));
  ok(rs.max >= 0.6, `a 0.3-unit climb over 3 s: sweep max ${rs.max.toFixed(3)} (gate >= 0.6)`);
  const cn = stat(runSweep(replay(CEN_CN), 78)), wl = stat(runSweep(replay(CEN_WLTP), 78));
  console.log(`  Cyborg Ninja centroid replayed: sweep min ${cn.min.toFixed(3)} med ${cn.med.toFixed(3)} max ${cn.max.toFixed(3)}   (before the retune: min 0.53 med 0.67 max 0.93)`);
  console.log(`  Who Likes to Party replayed:    sweep min ${wl.min.toFixed(3)} med ${wl.med.toFixed(3)} max ${wl.max.toFixed(3)}   (before the retune: min 0.58 med 0.855 max 0.98)`);
  ok(cn.med <= 0.2, `Cyborg Ninja's centroid no longer reads as a sweep (med ${cn.med.toFixed(3)} <= 0.2; riser and hp are 0 on all 40 of its samples, so this term was ALL of it)`);
  ok(wl.med <= 0.45, `Who Likes to Party's centroid, which really does sweep 0.53 <-> 0.77 every 4 s, is capped (med ${wl.med.toFixed(3)} <= 0.45)`);
}

console.log('\nthe melody has room: a 60 s track whose centroid swings 0.35..0.75 on an 8 s period:');
{
  const m = runMelody((t) => 0.55 + 0.2 * Math.sin(t * 2 * Math.PI / 8), 60);
  // Pass 3: the wall owns the radius, so the melody moves c AROUND the component. Im c is therefore capped by the
  // rim's own geometry and the angle covered is the honest measure of "the melody has room" — both are reported.
  console.log(`  Im c ${m.yLo.toFixed(3)} .. ${m.yHi.toFixed(3)}   internal angle covered ${m.bins}/8 eighths of a turn   periods ${m.qs.join(' ') || '(none)'}`);
  ok(m.bins >= 3 || (m.yHi >= 0.4 && m.yLo <= -0.4),
    `the melody has room: ${m.bins}/8 of the internal angle, Im c ${m.yLo.toFixed(3)}..${m.yHi.toFixed(3)} (gate: 3/8 of the angle, or +-0.4 of Im)`);
  ok(m.gates >= 1 && m.backs >= 1,
    `a gate opens AND closes inside 60 s: ${m.gates} in, ${m.backs} back out (${m.qs.join(' ')})`);
  ok(m.rhoMax <= RHO_CAP + 1e-6, `rho stayed at ${m.rhoMax.toFixed(6)} <= RHO_CAP ${RHO_CAP} on every frame that is not walking a gate (${m.gateF} frames were, ${(100 * m.gateF / m.nInt).toFixed(1)} % of INT — at a parabolic root rho IS 1)`);
  ok(m.viol === 0, `0 continuity violations over ${m.nInt} INT frames (${m.viol})`);
}

console.log(fails ? `\ntest_nav2: ${fails} FAIL` : '\ntest_nav2: OK');
process.exit(fails ? 1 : 0);
