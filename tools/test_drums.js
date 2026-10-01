// Node test for assets/engine/drums (the reactive drums v2): the two rules the stage adds on top of its sources.
//   · synapse's hits are HELD until heard: 42.7 ms ahead (file det) -> released one 60 Hz frame later (the frame nearest
//     42.7 - SYN_DELAY = 11.7 ms); in capture (ahead < 0) at once; the levels keep synapse's peak and decay
//   · the kick = the ears' low onsets, strength = the rise's rank among the recent ones: the strongest reads 1 x the bass
//     factor, the weakest S0 x it; a louder bass section lifts every hit
// Plus (DECISIONS §68) the SOURCE of that kick — the ears' LOW lane — on a synthetic masked kick, because that is the
// one case the real tracks could not isolate: a continuous sub drone with a soft thud above it. No PCM file needed.
//   node tools/test_drums.js
import { Drums, DRUMS } from '../assets/engine/drums/drums.js';
import { Ears } from '../assets/engine/ears/ears.js';

let FAIL = 0;
const ok = (name, pass, value) => { if (!pass) FAIL++; console.log('  ' + (pass ? 'pass' : 'FAIL') + '  ' + name.padEnd(62) + value); };
const dt = 1 / 60;
const syn = () => ({ kick: 0, snare: 0, hat: 0 });

console.log('hold');
for (const [ahead, want, label] of [[0.0427, 1, 'file det (42.7 ms ahead)'], [-0.027, 0, 'capture (27 ms behind)']]) {
  const d = new Drums(), A = syn();
  let at = -1;
  for (let f = 0; f < 10; f++) {
    A.snare *= Math.exp(-dt / 0.13);
    if (f === 3) A.snare = 0.8;                           // synapse finds a snare on frame 3
    const o = d.step({ syn: A, bassN: 0.5, low: 0, lowFl: 0, ahead, dt });
    if (at < 0 && o.snare2 > 0.5) at = f;
  }
  ok(`${label}: snare2 released ${want} frame(s) after synapse's`, at === 3 + want, `frame ${at}`);
}
{
  const d = new Drums(), A = syn();
  const v = [];
  for (let f = 0; f < 12; f++) { A.snare *= Math.exp(-dt / 0.13); if (f === 0) A.snare = 0.8; v.push(d.step({ syn: A, bassN: 0.5, low: 0, lowFl: 0, ahead: 0, dt }).snare2); }
  ok('no hold: snare2 = synapse\'s snare, frame by frame', v.every((x, f) => Math.abs(x - 0.8 * Math.exp(-f * dt / 0.13)) < 1e-6), `peak ${v[0].toFixed(3)}`);
}
console.log('kick strength');
{
  const d = new Drums(), A = syn(), pk = [];
  const fl = [2, 4, 6, 8, 3, 5, 7, 9, 5, 5, 5, 5, 10, 1];   // low onsets, one every 20 frames
  for (let f = 0; f < fl.length * 20; f++) {
    const hit = f % 20 === 0;
    const o = d.step({ syn: A, bassN: 1, low: hit ? 1 : 0, lowFl: hit ? fl[f / 20] : 0, ahead: 0, dt });
    if (hit) pk.push(o.kick2);
  }
  ok('a cold start: the first hit reads the middle, not the top', pk[0] > 0.2 && pk[0] < 0.6, pk.slice(0, 4).map((x) => x.toFixed(2)).join(' '));
  ok('once warm the loudest reads 1 x the bass factor, the quietest S0', Math.abs(pk[12] - 1) < 1e-6 && Math.abs(pk[13] - DRUMS.S0) < 1e-6, `${pk[12].toFixed(3)} ${pk[13].toFixed(3)}`);
  ok('a middling hit reads between S0 and 1, on the curve', pk[9] > DRUMS.S0 && pk[9] < 0.7, pk.map((x) => x.toFixed(2)).join(' '));
  const d2 = new Drums(), q = [];
  for (const b of [0, 1]) for (let f = 0; f < 40; f++) { const hit = f % 20 === 0; const o = d2.step({ syn: A, bassN: b, low: hit ? 1 : 0, lowFl: 5, ahead: 0, dt }); if (hit) q.push(o.kick2); }
  ok('the same hit is stronger in a louder bass section', q[3] > q[1] * 1.5, `${q[1].toFixed(2)} -> ${q[3].toFixed(2)}`);
}
// ---------------------------------------------------------------------------------------------------------------
// §68 THE LOW LANE under a sub drone. 20 bars at 120 BPM, 48 kHz: a continuous D#1 (38.89 Hz, the note Vienna's 808
// holds) at 0.40 with NO pulse at all, and a thud on beats 1 and 3 — a 95 Hz sine decaying over 30 ms at 0.18, with
// a 4 kHz beater click at 0.3x so the `kick` class fires too. The geometry IS the Vienna failure, in its purest
// form: a 4th-order high-pass at 40 Hz passes a 38.89 Hz drone at -3 dB, so in a 40-150 Hz band this kick is only
// +0.9 dB over the drone — under the old lane's own 1.2 dB flux floor — while in 60-150 Hz the drone is 15 dB down
// and the same kick is +9 dB. Measured both ways in this file's own harness (`git show HEAD~:…/perc.js`, §68):
//   the 40-150 Hz flux lane   low n 39  P 0.87  R 0.87   lag p50 +12.7  p90 +23.3 ms
//   the 60-150 Hz rise lane   low n 39  P 1.00  R 1.00   lag p50  +1.3  p90 +12.0 ms
// The first kick is inside the lane's own 85 ms baseline warm-up, so the reference is kicks 2..40.
console.log('the low lane under a sub drone (§68)');
{
  const SR = 48000, BEAT = 0.5, BARS = 20, DUR = BARS * 4 * BEAT, N = Math.round(DUR * SR);
  const kicks = [];
  for (let bar = 0; bar < BARS; bar++) for (const b of [0, 2]) kicks.push((bar * 4 + b) * BEAT);
  const L = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    let x = 0.40 * Math.sin(2 * Math.PI * 38.89 * t);              // the drone: continuous, no pulse
    for (const k of kicks) {
      const d = t - k;
      if (d >= 0 && d < 0.25) {
        x += 0.18 * Math.exp(-d / 0.030) * Math.sin(2 * Math.PI * 95 * d);          // the masked thud
        x += 0.054 * Math.exp(-d / 0.004) * Math.sin(2 * Math.PI * 4000 * d);       // its beater click
      }
    }
    L[i] = x;
  }
  const ears = new Ears(SR), B = 512, bl = new Float32Array(B);
  const low = [], kick = [], vel = [], den = [], amp = [];
  let next = 0;
  for (let s = 0; s + B <= N; s += B) {
    bl.set(L.subarray(s, s + B)); ears.push(bl, bl, s / SR);
    const tEnd = (s + B) / SR;
    while (next <= tEnd) {
      const o = ears.read(next);
      for (const e of ears.lowReleased) low.push(e.t);
      for (const e of ears.events) if (e.type === 'kick') { kick.push(e.t); vel.push(o.kickVel); den.push(o.denK); amp.push(o.kickAmp); }
      next += 1 / 60;
    }
  }
  const ref = kicks.slice(1);
  const grade = (det) => {
    const used = new Array(ref.length).fill(false); let tp = 0; const lag = [];
    for (const d of det) {
      let j = -1, best = 0.031;
      for (let i = 0; i < ref.length; i++) { if (used[i]) continue; const e = Math.abs(d - ref[i]); if (e <= 0.030 && e < best) { best = e; j = i; } }
      if (j >= 0) { used[j] = true; tp++; lag.push(d - ref[j]); }
    }
    lag.sort((a, b) => a - b);
    return { n: det.length, P: tp / Math.max(1, det.length), R: tp / ref.length,
      p50: 1000 * (lag[lag.length >> 1] || 0), p90: 1000 * (lag[Math.floor(0.9 * lag.length)] || 0) };
  };
  const gl = grade(low), gk = grade(kick);
  ok('the low lane finds every masked kick (P >= 0.95)', gl.P >= 0.95 && gl.R >= 0.95,
    `n ${gl.n}/${ref.length}  P ${gl.P.toFixed(3)}  R ${gl.R.toFixed(3)}`);
  ok('... on time (median lag <= 10 ms, no fire before the thud)', Math.abs(gl.p50) <= 10 && gl.p50 > -10,
    `p50 ${gl.p50.toFixed(1)} ms, p90 ${gl.p90.toFixed(1)} ms`);
  ok('... and never twice for one thud (the 85 ms refractory)', gl.n <= ref.length + 1, `${gl.n} fires for ${ref.length} kicks`);
  ok('kickEvt follows the same lane (the beater confirms every one)', gk.P >= 0.95 && gk.R >= 0.95 && Math.abs(gk.p50) <= 10,
    `n ${gk.n}/${ref.length}  P ${gk.P.toFixed(3)}  R ${gk.R.toFixed(3)}  p50 ${gk.p50.toFixed(1)} ms`);
  ok('kickVel is a share of the lane\'s own p95, not a constant', vel.length > 8 && Math.min(...vel) < Math.max(...vel) && Math.max(...vel) <= 1,
    `min ${Math.min(...vel).toFixed(3)} max ${Math.max(...vel).toFixed(3)}`);
  ok('denK counts the lane\'s hits in the last second (2 kicks/s here)', den.length > 8 && Math.abs(den[den.length - 1] - 2) <= 1,
    `last ${den[den.length - 1]} /s`);
  // §70: the same synthetic thud, +9 dB over the drone it is masked by, read through the 16 dB span -> ~0.31-0.56.
  // The spread is the attack's intra-hop PHASE (a 0.5 s beat is 46.875 hops, so each kick lands differently inside
  // its hop and a part-filled hop shows part of the rise); what matters is that NOTHING reads 1.000, where `kickVel`
  // puts 28 of these 39 identical kicks at the ceiling.
  const ceil = (a) => a.filter((x) => x >= 0.9995).length;
  ok('kickAmp is the rise over the 16 dB span, and never the ceiling (§70)',
    amp.length > 8 && Math.max(...amp) < 0.95 && Math.min(...amp) > 0.2 && ceil(amp) === 0 && ceil(vel) > 8,
    `amp ${Math.min(...amp).toFixed(3)}-${Math.max(...amp).toFixed(3)}, ${ceil(amp)} at 1.000; kickVel ${Math.min(...vel).toFixed(3)}-${Math.max(...vel).toFixed(3)}, ${ceil(vel)} of ${vel.length} at 1.000`);
}

// ---------------------------------------------------------------------------------------------------------------
// §69 THE SNARE LANE, on the two cases the five real tracks could not isolate. Both are graded against the OLD lane
// in its own tree (`git worktree add --detach <dir> 4e175e5`, the same file run there), quoted per case.
//
// (a) A RIM ON 2 AND 4 UNDER 16th HATS — CyborgNinja's geometry. 20 bars at 120 BPM, 48 kHz: a continuous mid BED
//     (300 / 700 / 1500 Hz at 0.10 — without one, a hat on silence is an infinite rise in every band it touches,
//     however faint, and the test would say nothing), a hat on every 16th (white noise through a first-difference
//     high-pass, 10 ms decay, 0.40 — a real hat bleeds into 150-2500, which is why the truth's own `mid` list
//     counts hats on that track) and a rim on beats 2 and 4 (a 220 Hz body plus noise, 45 ms decay, 0.50).
//       the 150-2500 flux lane (old)   snare 51 fires for 40 rims   P 0.78  R 1.00   lag p50 -4.7 ms
//       the two-band rise lane         snare 40 fires for 40 rims   P 1.00  R 1.00   lag p50 -8.7 ms
//     The hat lane is untouched by the change: 310 fires for 320 hats either way.
//
// (b) A SNARE UNDER A MID PAD SWELL — §64's "a median lags a swell", on the MID band this time. A 330/440/550/1100
//     Hz pad at 0.15 of its level, swelling to full over 1.5 s from t = 1 s and held, with one rim at 3.0 s. A rise
//     over an 85 ms LOCAL MEAN cannot see a ramp that slow; a median-9 residual's flux steps up all the way through
//     it. The old lane fires twice inside the swell (1.034 and 1.162 s); the new one fires only on the stick.
//     (The boundary is honest: at a 0.4 s swell the new lane fires once too — that fast a rise IS an onset.)
const SYN_SR = 48000;
function rngf(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2147483648 - 1; }; }
function runEars(L, SR) {
  const ears = new Ears(SR), B = 512, bl = new Float32Array(B);
  const snare = [], hat = [], vel = [], den = [];
  let next = 0;
  for (let s = 0; s + B <= L.length; s += B) {
    bl.set(L.subarray(s, s + B)); ears.push(bl, bl, s / SR);
    const tEnd = (s + B) / SR;
    while (next <= tEnd) {
      const o = ears.read(next);
      for (const e of ears.events) { if (e.type === 'snare') { snare.push(e.t); vel.push(o.snareVel); } else if (e.type === 'hat') hat.push(e.t); }
      den.push(o.denS);
      next += 1 / 60;
    }
  }
  return { snare, hat, vel, den };
}
function gradeAt(det, ref, tol = 0.030) {
  const used = new Array(ref.length).fill(false); let tp = 0; const lag = [];
  for (const d of det) {
    let j = -1, best = tol + 1e-9;
    for (let i = 0; i < ref.length; i++) { if (used[i]) continue; const e = Math.abs(d - ref[i]); if (e <= tol && e < best) { best = e; j = i; } }
    if (j >= 0) { used[j] = true; tp++; lag.push(d - ref[j]); }
  }
  lag.sort((a, b) => a - b);
  return { n: det.length, P: tp / Math.max(1, det.length), R: tp / ref.length,
    p50: 1000 * (lag[lag.length >> 1] || 0), p90: 1000 * (lag[Math.floor(0.9 * lag.length)] || 0) };
}

console.log('the snare lane: a rim on 2 and 4 under 16th hats (§69)');
{
  const SR = SYN_SR, BEAT = 0.5, BARS = 20, N = Math.round(BARS * 4 * BEAT * SR);
  const rims = [], hats = [];
  for (let bar = 0; bar < BARS; bar++) {
    for (const b of [1, 3]) rims.push((bar * 4 + b) * BEAT);
    for (let k = 0; k < 16; k++) hats.push(bar * 4 * BEAT + k * BEAT / 4);
  }
  const rnd = rngf(12345), nz = new Float32Array(N);
  for (let i = 0; i < N; i++) nz[i] = rnd();
  const hp = new Float32Array(N);                           // a first difference: +6 dB / octave, so the hat is a
  for (let i = 1; i < N; i++) hp[i] = nz[i] - nz[i - 1];    // high-band burst that still bleeds into 150-2500
  const L = new Float32Array(N);
  for (let i = 0; i < N; i++) { const t = i / SR;
    L[i] = 0.10 * (Math.sin(2 * Math.PI * 300 * t) + Math.sin(2 * Math.PI * 700 * t) + Math.sin(2 * Math.PI * 1500 * t)) / 3; }
  for (const h of hats) { const i0 = Math.round(h * SR);
    for (let i = i0; i < Math.min(N, i0 + Math.round(0.05 * SR)); i++) L[i] += 0.40 * Math.exp(-(i - i0) / SR / 0.010) * hp[i]; }
  for (const r of rims) { const i0 = Math.round(r * SR);
    for (let i = i0; i < Math.min(N, i0 + Math.round(0.20 * SR)); i++) { const d = (i - i0) / SR;
      L[i] += 0.50 * Math.exp(-d / 0.045) * (0.7 * Math.sin(2 * Math.PI * 220 * d) + 0.5 * nz[i]); } }
  const { snare, hat, vel, den } = runEars(L, SR);
  const g = gradeAt(snare, rims);
  ok('the snare lane finds every rim (P >= 0.95, R >= 0.95)', g.P >= 0.95 && g.R >= 0.95,
    `n ${g.n}/${rims.length}  P ${g.P.toFixed(3)}  R ${g.R.toFixed(3)}`);
  ok('... on time (|median lag| <= 10 ms)', Math.abs(g.p50) <= 10, `p50 ${g.p50.toFixed(1)} ms, p90 ${g.p90.toFixed(1)} ms`);
  ok('... and never twice for one rim (the 75 ms refractory)', g.n <= rims.length + 1, `${g.n} fires for ${rims.length} rims`);
  ok('... and the 320 16th hats under it fire the HAT lane, not this one', hat.length > 250 && g.n - g.P * g.n < 2,
    `${Math.round(g.n * (1 - g.P))} of the snare lane's ${g.n} fires are not a rim; the hat lane has ${hat.length}`);
  ok('snareVel is a share of the lane\'s own p95, not a constant', vel.length > 8 && Math.min(...vel) < Math.max(...vel) && Math.max(...vel) <= 1,
    `min ${Math.min(...vel).toFixed(3)} max ${Math.max(...vel).toFixed(3)}`);
  ok('denS counts the lane\'s hits in the last second (1 rim/s here)', den.length > 8 && Math.abs(den[den.length - 1] - 1) <= 0.5,
    `last ${den[den.length - 1]} /s`);
}

console.log('the snare lane: a snare under a mid pad swell (§69)');
{
  const SR = SYN_SR, DUR = 8, N = Math.round(DUR * SR), HIT = 3.0, T0 = 1, TC = 1.5;
  const rnd = rngf(999), L = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const t = i / SR, a = 0.15 + 0.85 * Math.max(0, Math.min(1, (t - T0) / TC));
    L[i] = 0.30 * a * (Math.sin(2 * Math.PI * 330 * t) + Math.sin(2 * Math.PI * 440 * t)
      + Math.sin(2 * Math.PI * 550 * t) + Math.sin(2 * Math.PI * 1100 * t)) / 4;
  }
  const i0 = Math.round(HIT * SR);
  for (let i = i0; i < Math.min(N, i0 + Math.round(0.20 * SR)); i++) { const d = (i - i0) / SR;
    L[i] += 0.50 * Math.exp(-d / 0.045) * (0.7 * Math.sin(2 * Math.PI * 220 * d) + 0.5 * rnd()); }
  const { snare } = runEars(L, SR);
  const onHit = snare.filter((t) => Math.abs(t - HIT) <= 0.030);
  const inSwell = snare.filter((t) => t >= T0 - 0.1 && t <= HIT - 0.2);
  ok('the snare fires on the stick', onHit.length === 1, `${onHit.length} fire(s) within 30 ms of ${HIT} s`);
  ok('... and the SWELL itself fires nothing (0.9-2.8 s; the old lane fired twice)', inSwell.length === 0,
    `${inSwell.length} fires during the swell`);
  ok('... and the held pad after it fires nothing either', snare.filter((t) => t > HIT + 0.3).length === 0,
    `${snare.filter((t) => t > HIT + 0.3).length} after the stick, ${snare.length} in the whole ${DUR} s`);
}

// THE HIT'S SIZE (§70): `snareAmp` is the lane's own two-band RISE over an absolute 12 dB span, so a soft hit and a
// hard one read different sizes where `snareVel` reads 1.000 for 52-91 % of the five tracks' hits (the velocity's
// divisor is `Quantile(0.95, ...)`, which in this engine's dsp.js settles on the (1 - q) quantile = the lane's p5).
// ONE rim template, scaled: the only difference between the three runs is the hit's amplitude, so the amp's own
// mapping is what is being measured. The hit starts ON a hop boundary — a rim that starts mid-hop shows only part of
// its rise in the hop that fires, and that phase swamps the amplitude itself.
console.log('the hit\'s size: a soft and a hard snare (§70)');
{
  const SR = SYN_SR, HOP = 512 / SR, AT = 470 * HOP;
  const RN = Math.round(0.20 * SR), rnd = rngf(4242), RIM = new Float32Array(RN);
  for (let i = 0; i < RN; i++) { const d = i / SR; RIM[i] = Math.exp(-d / 0.045) * (0.7 * Math.sin(2 * Math.PI * 220 * d) + 0.5 * rnd()); }
  const hit = (a) => {
    const N = Math.round((AT + 1.5) * SR), L = new Float32Array(N);
    for (let i = 0; i < N; i++) { const t = i / SR;         // the same continuous mid bed the rim test uses
      L[i] = 0.10 * (Math.sin(2 * Math.PI * 300 * t) + Math.sin(2 * Math.PI * 700 * t) + Math.sin(2 * Math.PI * 1500 * t)) / 3; }
    for (let i = 0; i < RN && 470 * 512 + i < N; i++) L[470 * 512 + i] += a * RIM[i];
    const ears = new Ears(SR), B = 512, bl = new Float32Array(B), out = [];
    let next = 0;
    for (let s0 = 0; s0 + B <= N; s0 += B) {
      bl.set(L.subarray(s0, s0 + B)); ears.push(bl, bl, s0 / SR);
      const tEnd = (s0 + B) / SR;
      while (next <= tEnd) { const o = ears.read(next);
        for (const e of ears.events) if (e.type === 'snare') out.push({ t: e.t, amp: o.snareAmp, vel: o.snareVel });
        next += 1 / 60; }
    }
    return { all: out, at: out.filter((x) => Math.abs(x.t - AT) < 0.05) };
  };
  const soft = hit(0.11), mid = hit(0.30), hard = hit(0.35), under = hit(0.10);
  ok('a hit under the lane\'s 3.75 dB floor does not fire at all', under.all.length === 0 && soft.at.length === 1,
    `${under.all.length} fires at a=0.10, ${soft.at.length} at a=0.11`);
  ok('a SOFT snare (just over the floor) reads snareAmp 0.3 +- 0.1', Math.abs(soft.at[0].amp - 0.3) <= 0.1,
    `${soft.at[0].amp.toFixed(3)} (the floor itself maps to 3.75/12 = 0.3125)`);
  ok('a HARD snare reads snareAmp 1.0 +- 0.1', hard.at.length === 1 && Math.abs(hard.at[0].amp - 1.0) <= 0.1,
    `${hard.at[0].amp.toFixed(3)} at a=0.35, ${mid.at[0].amp.toFixed(3)} at a=0.30`);
  ok('... and the SPAN does the work, not the clamp: 3.2x the amplitude is +10 dB of rise',
    mid.at[0].amp > soft.at[0].amp + 0.4 && mid.at[0].amp < 1,
    `a 0.11 -> 0.30 moves the amp ${soft.at[0].amp.toFixed(3)} -> ${mid.at[0].amp.toFixed(3)} (20log10(0.30/0.11)/12 = ${(20 * Math.log10(0.30 / 0.11) / 12).toFixed(3)})`);
  ok('snareVel on that same frame carries nothing (the ring is one hit stale)',
    soft.at[0].vel === 0 && hard.at[0].vel === 0, `vel ${soft.at[0].vel} soft / ${hard.at[0].vel} hard, amp ${soft.at[0].amp.toFixed(3)} / ${hard.at[0].amp.toFixed(3)}`);
}

console.log(FAIL ? `test_drums: ${FAIL} FAILED` : 'test_drums: OK');
process.exit(FAIL ? 1 : 0);
