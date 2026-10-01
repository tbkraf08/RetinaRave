// Node test of the PCM beat clock (assets/engine/clock: period.js + clock.js) on synthetic audio — live step 6 T.2.
// The audio is a click train (a 4 ms noise burst + a decaying 60 Hz thump per hit, ±JIT ms of timing jitter) at 48 kHz, pushed in
// the PCM bus's 512-sample blocks; each hit is also handed to the clock as an ears-style onset (kick, vel 1) at its jittered
// time — the page's two inputs. Graded against the TRUE grid (the un-jittered hit times):
//   lock        locked within LOCK_S s of a cold start; then the beat line within PH_MS of the truth, the tempo within BPM_TOL
//   ramp        a tempo ramp 128 → 132 over 20 s is followed within RAMP_TOL BPM
//   gap         6 s with no hits: the line coasts on its rate and is within GAP_MS when the hits return (no re-lock needed)
//   outlier     one loud off-grid hit (half a beat off) moves the line by < OUT_MS
//   lattice     kicks on every 8th with the on-beat ones louder: the line lands on the loud lattice (the comb line's vote)
//   band        kicks on the beat and LOUDER snares (no low band) on the off-beat: the line lands on the KICKS (§59's
//               lattice check — the full-spectrum comb line and the onsets both prefer the louder off-beat)
//   band flip   the same audio, but only the snares for the first 8 s: the cold start locks to them and the check MOVES the line
//   backbeat    kicks on the beat and snares 40 ms LATE on 2 and 4: the line stays on the KICKS within BACK_MS (§71 — the
//               clock does not follow a laid-back backbeat, so a track-wide late bias cannot be one)
//   determinism two runs are identical to the last bit
//   node tools/test_clock.js            -> per-case lines + OK / FAIL
import { Clock, CLOCK } from '../assets/engine/clock/clock.js';
if (process.env.CLOCKK) Object.assign(CLOCK, JSON.parse(process.env.CLOCKK));

const SR = 48000, B = 512;
const LOCK_S = 6, PH_MS = 12, BPM_TOL = 0.5, RAMP_TOL = 1.0, GAP_MS = 30, OUT_MS = 6, BACK_MS = 5;
let seed = 12345;
const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;

// hits: [{ t (true), tj (jittered), vel, loud }]; -> { pcm: Float32Array, hits }
function synth(secs, plan) {
  const n = Math.ceil(secs * SR), pcm = new Float32Array(n), hits = [];
  for (const h of plan) {
    const tj = h.t + (rnd() - 0.5) * 2 * (h.jit === undefined ? 0.004 : h.jit), i0 = Math.round(tj * SR), a = h.loud === undefined ? 1 : h.loud;
    for (let i = 0; i < 0.004 * SR && i0 + i < n; i++) pcm[i0 + i] += a * 0.6 * (rnd() * 2 - 1);                       // the click
    if (!h.noLow) for (let i = 0; i < 0.08 * SR && i0 + i < n; i++) pcm[i0 + i] += a * 0.8 * Math.sin(2 * Math.PI * 60 * i / SR) * Math.exp(-i / (0.03 * SR)); // the thump
    hits.push({ t: h.t, tj, vel: h.vel === undefined ? a : h.vel, cls: h.cls || 0 });
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
    while (hi < hits.length && hits[hi].tj < t1) { const h = hits[hi++]; if (!(gap && h.t >= gap[0] && h.t < gap[1])) clk.onset(h.tj, h.cls || 0, h.vel); }
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
// 6. band (§59): hits on every 8th — a KICK (click + 60 Hz thump) on the beat and a LOUDER SNARE (click only, no low band)
//    on the off-beat. This is CyborgNinja's shape: the onsets fit both lattices and the full-spectrum comb line, which the
//    louder off-beat dominates, prefers the WRONG one; only the 40-150 Hz band says which lattice is the beat.
{
  const SECS = 70, beat = 60 / 128, plan = [];
  for (let t = 0.2, k = 0; t < SECS; t += beat / 2, k++) plan.push(k % 2 === 0 ? { t } : { t, loud: 2.2, vel: 1, cls: 1, noLow: true });
  const beats = plan.filter((h, i) => i % 2 === 0).map((h) => h.t);
  const { pcm, hits } = synth(SECS, plan), { rows, clk } = run(pcm, hits);
  const half = beat / 2 * 1000;
  const late = beats.filter((T) => T > 40), e = late.map((T) => errAt(rows, T));
  const on = (v) => Math.abs(v) <= 2 * PH_MS, first = beats.find((T) => T > 8 && on(errAt(rows, T)) && beats.filter((U) => U > T && U < T + 8).every((U) => on(errAt(rows, U))));
  console.log(`band (8ths, off-beat 2.2x louder but no low band): err vs the KICK lattice after 40 s med ${med(e).toFixed(1)} p90 ${p90(e).toFixed(1)} ms (half a beat = ${half.toFixed(0)}) · on the kicks from ${first === undefined ? '-' : first.toFixed(1) + ' s'} · bpm ${clk.bpm.toFixed(2)} lat ${clk.lat.toFixed(3)} latJumps ${clk.latJumps}`);
  check('band', Math.abs(med(e)) <= 2 * PH_MS && p90(e) <= 3 * PH_MS, `on the kick lattice within ${2 * PH_MS} ms (the snares' lattice reads ±${half.toFixed(0)})`);
  check('band tempo', Math.abs(clk.bpm - 128) <= BPM_TOL, `the beat, not the 8th (${clk.bpm.toFixed(2)})`);
}
// 7. band, from the wrong lattice (§59): the same audio, but the first 8 s carry ONLY the loud snares, so the cold start
//    locks to them; the kicks then come in on the beat and the lattice check has to MOVE the line (latJumps 1).
{
  const SECS = 80, beat = 60 / 128, plan = [];
  for (let t = 0.2, k = 0; t < SECS; t += beat / 2, k++) {
    if (k % 2 === 0) { if (t > 8) plan.push({ t }); }                       // the kick, only after 8 s
    else plan.push({ t, loud: 2.2, vel: 1, cls: 1, noLow: true });          // the loud snare, all the way through
  }
  const beats = [];
  for (let t = 0.2, k = 0; t < SECS; t += beat / 2, k++) if (k % 2 === 0) beats.push(t);
  const { pcm, hits } = synth(SECS, plan), { rows, clk } = run(pcm, hits);
  const before = beats.filter((T) => T > 5 && T < 8).map((T) => errAt(rows, T));
  const after = beats.filter((T) => T > 50).map((T) => errAt(rows, T));
  const on = (v) => Math.abs(v) <= 2 * PH_MS, moved = beats.find((T) => T > 8 && on(errAt(rows, T)) && beats.filter((U) => U > T && U < T + 8).every((U) => on(errAt(rows, U))));
  console.log(`band flip (snares only for 8 s, then the kicks): err vs the KICK lattice before ${med(before).toFixed(0)} ms -> after 50 s med ${med(after).toFixed(1)} p90 ${p90(after).toFixed(1)} ms · moved at ${moved === undefined ? '-' : moved.toFixed(1) + ' s'} · lat ${clk.lat.toFixed(3)} latJumps ${clk.latJumps} jumps ${clk.jumps}`);
  check('band flip', Math.abs(med(before)) > 100 && Math.abs(med(after)) <= 2 * PH_MS && clk.latJumps >= 1, `off the kicks cold, on them after the check moves the line`);
}
// 8. a LAID-BACK BACKBEAT (§71): kicks on every beat and snares 40 ms LATE on 2 and 4 — the shape §69's Malicious row was
//    blamed on. Every snare is a phase measurement too (R_CLS[1] 1.5), so if the filter averaged the two classes the line
//    would settle a quarter of the way to the snares (~10 ms late). It does not: the kicks are twice as many, carry the low
//    band the comb's line is built on, and have the smaller R, so the line stays ON THE KICKS within BACK_MS. This is the
//    characterisation that says the +30 ms on Malicious cannot be a snare-weighting artefact (DECISIONS §71).
{
  const SECS = 70, beat = 60 / 128, LATE = 0.040, plan = [], beats = [];
  for (let t = 0.2, k = 0; t < SECS; t += beat, k++) {
    plan.push({ t, jit: 0 }); beats.push(t);                                        // the kick, on the beat
    if (k % 2 === 1) plan.push({ t: t + LATE, loud: 1.3, vel: 1, cls: 1, noLow: true, jit: 0 });   // the snare, 40 ms behind it
  }
  plan.sort((a, b) => a.t - b.t);
  const { pcm, hits } = synth(SECS, plan), { rows, clk } = run(pcm, hits);
  const e = beats.filter((T) => T > 20).map((T) => errAt(rows, T));
  console.log(`backbeat (kicks on the beat, snares +${1000 * LATE} ms on 2 and 4): err vs the KICKS after 20 s med ${med(e).toFixed(2)} p90 ${p90(e).toFixed(2)} ms · bpm ${clk.bpm.toFixed(2)} onsets ${clk.onsets} hits ${clk.hits} jumps ${clk.jumps}`);
  check('backbeat', Math.abs(med(e)) <= BACK_MS && p90(e) <= 2 * BACK_MS, `the line is on the kicks within ${BACK_MS} ms, not pulled toward the snares (+${1000 * LATE} ms)`);
  check('backbeat tempo', Math.abs(clk.bpm - 128) <= BPM_TOL, `the beat, not the 8th (${clk.bpm.toFixed(2)})`);
}
console.log(fail ? `test_clock: ${fail} FAIL` : 'test_clock: OK');
process.exit(fail ? 1 : 0);
