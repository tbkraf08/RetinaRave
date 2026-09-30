// Node test of the PCM beat clock (assets/engine/clock: period.js + clock.js) on synthetic audio — live step 6 T.2.
// The audio is a click train (a 4 ms noise burst + a decaying 60 Hz thump per hit, ±JIT ms of timing jitter) at 48 kHz, pushed in
// the PCM bus's 512-sample blocks; each hit is also handed to the clock as an ears-style onset (kick, vel 1) at its jittered
// time — the page's two inputs. Graded against the TRUE grid (the un-jittered hit times):
//   lock        locked within LOCK_S s of a cold start; then the beat line within PH_MS of the truth, the tempo within BPM_TOL
//   ramp        a tempo ramp 128 → 132 over 20 s is followed within RAMP_TOL BPM
//   gap         6 s with no hits: the line coasts on its rate and is within GAP_MS when the hits return (no re-lock needed)
//   outlier     one loud off-grid hit (half a beat off) moves the line by < OUT_MS
//   lattice     kicks on every 8th with the on-beat ones louder: the line lands on the loud lattice (the comb line's vote)
//   determinism two runs are identical to the last bit
//   node tools/test_clock.js            -> per-case lines + OK / FAIL
import { Clock, CLOCK } from '../assets/engine/clock/clock.js';

const SR = 48000, B = 512;
const LOCK_S = 6, PH_MS = 12, BPM_TOL = 0.5, RAMP_TOL = 1.0, GAP_MS = 30, OUT_MS = 6;
let seed = 12345;
const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;

// hits: [{ t (true), tj (jittered), vel, loud }]; -> { pcm: Float32Array, hits }
function synth(secs, plan) {
  const n = Math.ceil(secs * SR), pcm = new Float32Array(n), hits = [];
  for (const h of plan) {
    const tj = h.t + (rnd() - 0.5) * 2 * (h.jit === undefined ? 0.004 : h.jit), i0 = Math.round(tj * SR), a = h.loud === undefined ? 1 : h.loud;
    for (let i = 0; i < 0.004 * SR && i0 + i < n; i++) pcm[i0 + i] += a * 0.6 * (rnd() * 2 - 1);                       // the click
    for (let i = 0; i < 0.08 * SR && i0 + i < n; i++) pcm[i0 + i] += a * 0.8 * Math.sin(2 * Math.PI * 60 * i / SR) * Math.exp(-i / (0.03 * SR)); // the thump
    hits.push({ t: h.t, tj, vel: a });
  }
  for (let i = 0; i < n; i++) pcm[i] += 0.002 * (rnd() * 2 - 1);                                                     // a noise floor
  return { pcm, hits };
}
// a beat grid: tempo bpm(t) integrated; every `every` beats a hit (1 = every beat, 0.5 = every 8th) with `loud(k)` per hit
function grid(secs, bpm, every = 1, loud = () => 1, jit) {
  const plan = [];
  let t = 0.2, k = 0, beats = [];
  while (t < secs) {
    if (Math.abs(k % (1 / every)) < 1e-9 || every >= 1) beats.push(t);
    const b = typeof bpm === 'function' ? bpm(t) : bpm;
    plan.push({ t, loud: loud(k), jit });
    t += 60 / b * every; k++;
  }
  return { plan, beats: typeof bpm === 'function' ? null : beats };
}
// run the clock over the audio; -> per-hit read-outs at the TRUE hit times (after the whole audio is in: the phase at each
// truth beat as the clock published it then), plus the final state
function run(pcm, hits, gap) {
  const clk = new Clock(SR), blk = new Float32Array(B), rows = [];
  let hi = 0, t = 0;
  for (let s = 0; s + B <= pcm.length; s += B) {
    blk.set(pcm.subarray(s, s + B));
    const t0 = s / SR, t1 = t0 + B / SR;
    clk.push(blk, t0);
    // the ears would emit the onsets found in this block one hop later; hand them over at the block's end
    while (hi < hits.length && hits[hi].tj < t1) { const h = hits[hi++]; if (!(gap && h.t >= gap[0] && h.t < gap[1])) clk.onset(h.tj, 0, h.vel); }
    t = t1;
    rows.push({ t, b: clk.at(t).b, bpm: clk.bpm, conf: clk.conf });
  }
  return { clk, rows };
}
// the beat line error at truth time T from the clock's state at the block that ended just after T: (frac(b) wrapped) / bps
function errAt(rows, T) {
  let lo = 0, hi = rows.length - 1;
  while (lo < hi) { const m = (lo + hi) >> 1; if (rows[m].t < T) lo = m + 1; else hi = m; }
  const r = rows[Math.min(lo, rows.length - 1)], bT = r.b - (r.t - T) * r.bpm / 60, e = bT - Math.round(bT);
  return -e / (r.bpm / 60) * 1000;   // ms: + = the clock's line is LATE against the truth
}
const med = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[s.length >> 1] : NaN; };
const p90 = (a) => { const s = a.map(Math.abs).sort((x, y) => x - y); return s.length ? s[Math.floor(0.9 * (s.length - 1))] : NaN; };
let fail = 0;
const check = (name, ok, msg) => { if (!ok) fail++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}: ${msg}`); };

// 1. lock + steady
{
  const g = grid(30, 128), { pcm, hits } = synth(30, g.plan), { clk, rows } = run(pcm, hits);
  const after = g.beats.filter((T) => T > LOCK_S), e = after.map((T) => errAt(rows, T));
  const lockT = rows.find((r) => r.conf > 0.6 && Math.abs(r.bpm - 128) < 2);
  console.log(`lock 128: locked at ${lockT ? lockT.t.toFixed(1) : '-'} s · after ${LOCK_S} s: err med ${med(e).toFixed(1)} p90 ${p90(e).toFixed(1)} ms · bpm ${clk.bpm.toFixed(2)} conf ${clk.conf.toFixed(2)} · onsets ${clk.onsets} hits ${clk.hits} jumps ${clk.jumps}`);
  check('lock', lockT && lockT.t <= LOCK_S, `locked within ${LOCK_S} s`);
  check('phase', Math.abs(med(e)) <= PH_MS && p90(e) <= 2 * PH_MS, `|median| <= ${PH_MS} ms, p90 <= ${2 * PH_MS} ms`);
  check('tempo', Math.abs(clk.bpm - 128) <= BPM_TOL, `within ±${BPM_TOL} of 128`);
  // determinism
  seed = 12345; const g2 = grid(30, 128), s2 = synth(30, g2.plan), r2 = run(s2.pcm, s2.hits);
  check('determinism', r2.clk.b === clk.b && r2.clk.f === clk.f && r2.clk.P00 === clk.P00, 'two runs identical (b, f, P00)');
}
// 2. tempo ramp 128 -> 132 over 20 s (from t = 10)
{
  const bpm = (t) => (t < 10 ? 128 : t > 30 ? 132 : 128 + 4 * (t - 10) / 20), g = grid(40, bpm), { pcm, hits } = synth(40, g.plan), { rows } = run(pcm, hits);
  const late = rows.filter((r) => r.t > 34), errs = late.map((r) => Math.abs(r.bpm - 132)), mid = rows.filter((r) => r.t > 20 && r.t < 22).map((r) => Math.abs(r.bpm - bpm(r.t)));
  console.log(`ramp 128 -> 132: at 21 s |err| max ${Math.max(...mid).toFixed(2)} · after 34 s |err| max ${Math.max(...errs).toFixed(2)} BPM`);
  check('ramp', Math.max(...errs) <= RAMP_TOL && Math.max(...mid) <= 2 * RAMP_TOL, `within ±${RAMP_TOL} at the end, ±${2 * RAMP_TOL} mid-ramp`);
}
// 3. gap: no hits 15..21 s (silence in the audio too)
{
  const g = grid(30, 128), all = synth(30, g.plan.filter((h) => h.t < 15 || h.t >= 21)), { rows, clk } = run(all.pcm, all.hits);
  const ret = g.beats.filter((T) => T >= 21 && T < 22.5).map((T) => errAt(rows, T)), inGap = g.beats.filter((T) => T > 15 && T < 21).map((T) => errAt(rows, T));
  console.log(`gap 15-21 s: line error inside the gap med ${med(inGap).toFixed(1)} p90 ${p90(inGap).toFixed(1)} · at the return ${ret.map((v) => v.toFixed(0)).join(' ')} ms · conf in gap ${rows.find((r) => r.t > 20.9).conf.toFixed(2)} jumps ${clk.jumps}`);
  check('gap', p90(inGap) <= GAP_MS && Math.abs(ret[0]) <= GAP_MS, `coasts within ${GAP_MS} ms through 6 s of silence`);
}
// 4. outlier: one loud hit half a beat off at ~20 s
{
  const g = grid(30, 128), plan = g.plan.slice(), beat = 60 / 128, T0 = g.beats.find((T) => T > 20) + beat / 2;
  plan.push({ t: T0, loud: 1.5, jit: 0 }); plan.sort((a, b) => a.t - b.t);
  const { pcm, hits } = synth(30, plan), { rows } = run(pcm, hits);
  const before = g.beats.filter((T) => T > 18 && T < 20).map((T) => errAt(rows, T)), after = g.beats.filter((T) => T > T0 && T < T0 + 1.2).map((T) => errAt(rows, T));
  console.log(`outlier at ${T0.toFixed(2)} s (half a beat off, vel 1.5): line error before ${med(before).toFixed(1)} · the next beats ${after.map((v) => v.toFixed(1)).join(' ')} ms`);
  check('outlier', Math.abs(after[0] - med(before)) <= OUT_MS, `the first beat after it moved < ${OUT_MS} ms`);
}
// 5. lattice: hits on every 8th, the on-beat ones louder (1 vs 0.45); the clock must sit on the loud ones
{
  const g = grid(40, 128, 0.5, (k) => (k % 2 === 0 ? 1 : 0.45)), { pcm, hits } = synth(40, g.plan), { rows, clk } = run(pcm, hits);
  const e = g.beats.filter((T) => T > 12).map((T) => errAt(rows, T)), half = 60 / 128 / 2 * 1000;
  console.log(`lattice (8ths, on-beat louder): err vs the loud lattice med ${med(e).toFixed(1)} p90 ${p90(e).toFixed(1)} ms (half a beat = ${half.toFixed(0)}) · bpm ${clk.bpm.toFixed(2)} jumps ${clk.jumps}`);
  check('lattice', Math.abs(med(e)) <= 2 * PH_MS, `on the loud lattice within ${2 * PH_MS} ms (the other lattice reads ±${half.toFixed(0)})`);
  check('lattice tempo', Math.abs(clk.bpm - 128) <= BPM_TOL, `the beat, not the 8th (${clk.bpm.toFixed(2)})`);
}
console.log(fail ? `test_clock: ${fail} FAIL` : 'test_clock: OK');
process.exit(fail ? 1 : 0);
