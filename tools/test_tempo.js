// Node-level test of the canonical tempo estimator (assets/engine/tempo.js) on a synthetic onset envelope.
// Model of what features.js feeds it: a 60 Hz frame clock (dt jitter ±1 ms) computes one spectral-flux value per frame
// (each hit = a 2-frame triangular pulse of its amplitude, plus a little noise), the 100 Hz ring X.env is filled from
// it exactly as features.js does (envAcc += dt·100, zero-order hold), tempoEstimate() runs every 0.5 s.
// Patterns are the demo synth's (kick / snare / hat placements), so a 6 s "breakdown" gap (pads only) is the dnb case.
//   node tools/test_tempo.js            -> per-style table + OK / FAIL
//   TEMPO_MOD=<module path> runs another estimator with the same harness (the v3 one lived in features-slow.js until §9).
import { MS, XS } from '../assets/engine/state.js';

const mod = await import(process.env.TEMPO_MOD || '../assets/engine/tempo.js');
const tempoEstimate = mod.tempoEstimate;

// each entry: [beat offset within the bar (in beats), amplitude]; amplitudes ±30 % per hit, noise floor 0.05.
// dnb calibrated to the measured ACF on the demo synth (14 s, v3 envelope): beat multiples ≈ 0.45, 1.5/2.5-beat lags ≈ 0.17.
const PAT = {
  four: { bpm: 120, bar: 4, hits: [[0, 1], [1, 1], [2, 1], [3, 1], [0.5, 0.25], [1.5, 0.25], [2.5, 0.25], [3.5, 0.25]] },
  house: { bpm: 128, bar: 4, hits: [[0, 1], [1, 1], [2, 1], [3, 1], [0.5, 0.35], [1.5, 0.35], [2.5, 0.35], [3.5, 0.35], [0.25, 0.12], [0.75, 0.12], [1.25, 0.12], [1.75, 0.12], [2.25, 0.12], [2.75, 0.12], [3.25, 0.12], [3.75, 0.12]] },
  halftime: { bpm: 140, bar: 4, hits: [[0, 1], [2, 0.75], [0, 0.13], [0.5, 0.2], [1, 0.13], [1.5, 0.2], [2, 0.13], [2.5, 0.2], [3, 0.13], [3.5, 0.2]] },
  ambient: { bpm: 124, bar: 4, hits: [], pads: true }, // beatless: slow swells only -> bpm must not move off its default, regularity low
  dnb: { bpm: 174, bar: 4, hits: [[0, 1], [2, 0.8], [2.5, 0.45], [1, 0.5], [3, 0.5], [0, 0.08], [0.5, 0.1], [1, 0.08], [1.5, 0.1], [2, 0.08], [2.5, 0.1], [3, 0.08], [3.5, 0.1], [0.75, 0.05], [1.75, 0.05], [2.75, 0.05], [3.75, 0.05]] },
};

// deterministic PRNG so runs are repeatable
let seed = 12345;
const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;

function reset() {
  MS.bpm = 124; MS.regularity = 0; MS.beatPhase = 0; MS.phaseCorr = 0; MS.presence = 0;
  XS.env.fill(0); XS.ei = 0; XS.envAcc = 0; XS.tempoT = 0; XS.candBpm = 0; XS.candN = 0; XS.tempoAge = 99;
  if (XS._acf) XS._acf.fill(0);
  if (XS.tempo) XS.tempo = null;
}

// run `secs` seconds of the pattern (`gap` = [from, to] seconds with no hits), returning the 1 Hz bpm trace
function run(p, secs, gap) {
  const beat = 60 / p.bpm, hits = [];
  for (let t = 0; t < secs + 2; t += beat * p.bar) for (const [b, a] of p.hits) hits.push([t + b * beat + (rnd() - 0.5) * 0.004, a * (0.7 + 0.6 * rnd())]);
  hits.sort((a, b) => a[0] - b[0]);
  const trace = [];
  let t = 0, nextLog = 1, h0 = 0, tempoT = 0;
  while (t < secs) {
    const dt = 1 / 60 + (rnd() - 0.5) * 0.002, tm = t + dt / 2, inGap = gap && t >= gap[0] && t < gap[1];
    let o = rnd() * 0.05;
    if (p.pads) o += 0.12 + 0.1 * Math.sin(t * 0.9) + 0.06 * Math.sin(t * 2.3 + 1) + 0.04 * Math.sin(t * 5.1);
    while (h0 < hits.length && hits[h0][0] < t - dt) h0++;
    const ramp = p.ramp ? (0.3 + 0.35 * t / secs) * 2 : 1;
    if (p.ramp) o += 0.02 * Math.exp(t / secs * 3.8); // the build's noise sweep: 0.01 -> 0.45 exponential
    if (!inGap) for (let i = h0; i < hits.length && hits[i][0] < t + 2 * dt; i++) o += ramp * hits[i][1] * Math.max(0, 1 - Math.abs(tm - hits[i][0]) / dt);
    MS.presence = inGap ? 0.3 : 0.8;
    XS.envAcc += dt * 100;
    while (XS.envAcc >= 1) { XS.env[XS.ei] = o; XS.ei = (XS.ei + 1) % 800; XS.envAcc -= 1; }
    tempoT += dt;
    if (tempoT > 0.5) { tempoT = 0; tempoEstimate(); if (process.env.TEMPO_DEBUG === '2') console.log('   ', t.toFixed(1), JSON.stringify(XS._tempoDbg)); }
    t += dt;
    if (t >= nextLog) { trace.push(+MS.bpm.toFixed(2)); trace.regMax = Math.max(trace.regMax || 0, MS.regularity); nextLog++; }
    if (process.env.TEMPO_DEBUG && nextLog === 15 && XS._acf && !trace.dbg) {
      const a = XS._acf, pk = [];
      for (let L = 16; L < 410; L++) if (a[L] > a[L - 1] && a[L] >= a[L + 1] && a[L] > 0.08) pk.push(L + ':' + a[L].toFixed(2));
      trace.dbg = 1; console.log('  acf peaks @14 s:', pk.join(' '), JSON.stringify(XS._tempoDbg));
    }
  }
  return trace;
}

let fail = 0;
const check = (name, ok, msg) => { if (!ok) fail++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}: ${msg}`); };
for (const [name, p] of Object.entries(PAT)) {
  reset();
  const tr = run(p, 40, [20, 26]);
  if (p.pads) {
    console.log(`${name.padEnd(9)} pads  t=1..40: ${tr.join(' ')}  regMax ${tr.regMax.toFixed(2)}`);
    check('ambient hold', tr.every((b) => b === 124), 'bpm never moves off 124 on pads');
    check('ambient regularity', tr.regMax < 0.3, `max regularity ${tr.regMax.toFixed(2)} (< 0.3)`);
    continue;
  }
  const lock = tr.slice(10, 20), gapT = tr.slice(20, 27), after = tr.slice(30, 40);
  const err = (a) => Math.max(...a.map((b) => Math.abs(b - p.bpm)));
  console.log(`${name.padEnd(9)} ${p.bpm}  t=1..40: ${tr.join(' ')}`);
  check(`${name} lock`, err(lock) <= 0.5, `10–20 s within ±0.5 of ${p.bpm}: max err ${err(lock).toFixed(2)}`);
  check(`${name} gap`, err(gapT) <= 1, `held through the 6 s gap (20–26 s): max err ${err(gapT).toFixed(2)}`);
  check(`${name} after`, err(after) <= 0.5, `30–40 s within ±0.5: max err ${err(after).toFixed(2)}`);
}
// a build: 8 s of 32nd-note bursts under a rising ramp (the synth's `build`), then a 6 s hush, then the groove — the
// tempo must hold 128 throughout (the bursts light every lag; the ramp's trend favours short lags)
{
  reset();
  run(PAT.house, 20);
  const bursts = { bpm: 128, bar: 4, hits: [], ramp: true };
  for (let k = 0; k < 32; k++) bursts.hits.push([k / 8, 0.5]);
  const b = run(bursts, 8), h = run(PAT.house, 6, [0, 6]), g = run(PAT.house, 8);
  const all = [...b, ...h, ...g], err = Math.max(...all.map((v) => Math.abs(v - 128)));
  console.log(`build 32nds+ramp -> hush -> groove: ${all.join(' ')}`);
  check('build hold', err <= 1, `128 held through the build, hush and return: max err ${err.toFixed(2)}`);
}
// real tempo changes: the mix demo goes 128 -> (40 s beatless ambient) -> 1.5 s silence -> 174: pick-up within 4 s of
// the new beat; a direct 128 -> 174 cut has to drain the old groove from the 8 s window first: within 6 s.
{
  reset();
  run(PAT.house, 20); run(PAT.house, 10, [0, 10]); run(PAT.dnb, 1.5, [0, 1.5]);
  const c = run(PAT.dnb, 12), pick = c.findIndex((v) => Math.abs(v - 174) <= 1);
  console.log(`change 128 -> ambient -> 174: ${c.join(' ')}`);
  check('tempo change (via ambient)', pick >= 0 && pick + 1 <= 4, `174 picked up ${pick + 1} s after the silence (≤ 4)`);
  reset();
  run(PAT.house, 20);
  const d = run(PAT.dnb, 12), pd = d.findIndex((v) => Math.abs(v - 174) <= 1);
  console.log(`change 128 -> 174 direct: ${d.join(' ')}`);
  check('tempo change (direct)', pd >= 0 && pd + 1 <= 6, `174 picked up ${pd + 1} s after the cut (≤ 6)`);
}
console.log(fail ? `test_tempo: ${fail} FAIL` : 'test_tempo: OK');
process.exit(fail ? 1 : 0);
