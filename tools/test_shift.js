// Node test for assets/engine/shift (the energy shift, DECISIONS §143) on synthetic input, one frame per 1/60 s at 120 BPM (a bar = 2 s):
//   · a flat ladder never shifts; nothing fires before MIN_HIST s of music
//   · the ladder stepping up by STEP within a bar fires ONE shiftEvt, levels the hold, and the hold stays while the ladder is >= HOLD x level
//   · the hold releases only after REL bars under the line (a one-beat dip is a fill); a slow creep (STEP over 3 bars) never fires
//   · a confirmed drop levels the hold without a shift and no shift fires within REFR bars of it (a slam is not doubled)
//   · silence (ok false) clears the hold and the ring; a seek resets; a second step after REFR re-levels
//   · the build detector's confirmation (build/confirm.js): the sub back and the ladder's level release a pending slam on the first
//     frame both hold, PEND beats without them drop it, a NaN ladder (the loud stage off) needs the sub alone
//   node tools/test_shift.js
import { Shift, SHIFT, BeatRing } from '../assets/engine/shift/shift.js';
import { Confirm } from '../assets/engine/build/confirm.js';
import { BUILD } from '../assets/engine/build/build.js';

let FAIL = 0;
const ok = (name, pass, value) => { if (!pass) FAIL++; console.log('  ' + (pass ? 'pass' : 'FAIL') + '  ' + name.padEnd(70) + value); };
const dt = 1 / 60, BPM = 120, bps = BPM / 60;

function mk(knobs) {
  const s = new Shift(knobs ? Object.assign({}, SHIFT, knobs) : SHIFT), st = { s, B: 0, out: [] };
  st.run = (secs, lad, p = {}) => {   // lad: a number or a function of the seconds into this run
    const n = Math.round(secs / dt);
    let last = null;
    for (let f = 0; f < n; f++) {
      st.B += bps * dt;
      const L = typeof lad === 'function' ? lad(f * dt) : lad;
      const o = s.step({ B: st.B, bpm: BPM, ok: p.ok === undefined ? true : p.ok, lad: L, drop: p.drop && f === 0 ? 1 : 0, dt });
      last = { B: st.B, t: st.out.length * dt, evt: o.shiftEvt, hold: o.shiftHold };
      st.out.push(last);
    }
    return last;
  };
  return st;
}
const events = (st, from = 0) => st.out.filter((o, i) => i >= from && o.evt);
const holdFrames = (st, from = 0) => st.out.filter((o, i) => i >= from && o.hold).length;

console.log('1. the ring');
{
  const r = new BeatRing(8);
  for (let b = 0; b < 12; b++) r.push(b, b * 10);
  ok('at(B) reads the oldest sample at or after B', r.at(6) === 60 && r.at(5.5) === 60 && r.at(11) === 110, `${r.at(6)} ${r.at(5.5)} ${r.at(11)}`);
  ok('older than the ring holds: NaN', isNaN(r.at(3)), String(r.at(3)));
}

console.log('2. flat, and the warm-up');
{
  const st = mk();
  st.run(30, 0.6);
  ok('a flat ladder never shifts, never holds', events(st).length === 0 && holdFrames(st) === 0, `events ${events(st).length}`);
  const w = mk();
  w.run(10, 0.1); w.run(1, 0.9);   // a step inside the first 16 s
  ok(`a step before MIN_HIST ${SHIFT.MIN_HIST} s does not fire`, events(w).length === 0, `events ${events(w).length}`);
  const lo = mk();
  lo.run(18, 0.05); lo.run(1, 0.5);   // +.45, but only to .5
  ok(`a step that does not reach LEVEL ${SHIFT.LEVEL} does not fire (a piece waking up is not a shift)`, events(lo).length === 0, `events ${events(lo).length}`);
  lo.run(1, 0.8);   // half a bar later: .8, +.75 over the bar
  ok('... and fires once the ladder reaches it with the step still inside the bar', events(lo).length === 1, `events ${events(lo).length}`);
}

console.log('3. the step, the hold, the release');
{
  const st = mk();
  st.run(18, 0.2);
  const n0 = st.out.length;
  st.run(6, 0.8);   // +0.6 at once
  const ev = events(st, n0);
  ok('a step of STEP or more within a bar fires exactly one shiftEvt', ev.length === 1, `events ${ev.length} at ${ev.map((e) => e.t.toFixed(2))}`);
  ok('... on the frame the ladder stepped (reactive, no lag beyond the frame)', ev.length && ev[0].t - n0 * dt < 0.05, ev.length ? (ev[0].t - n0 * dt).toFixed(3) + ' s' : '-');
  ok('the hold is on through the plateau', st.out[st.out.length - 1].hold === 1 && holdFrames(st, n0) === st.out.length - n0, `held ${holdFrames(st, n0)} of ${st.out.length - n0}`);
  const n1 = st.out.length;
  st.run(0.5, 0.3);   // a one-beat dip under HOLD x level (.4) — a fill
  st.run(1, 0.8);
  ok('a dip shorter than REL bars does not release the hold', holdFrames(st, n1) === st.out.length - n1, `held ${holdFrames(st, n1)} of ${st.out.length - n1}`);
  const n2 = st.out.length;
  st.run(3, 0.3);   // under the line for 1.5 bars
  const rel = st.out.findIndex((o, i) => i >= n2 && !o.hold);
  ok(`the hold releases after REL ${SHIFT.REL} bars under HOLD x level`, rel > 0 && Math.abs((rel - n2) * dt - SHIFT.REL * 4 / bps) < 0.05, rel > 0 ? ((rel - n2) * dt).toFixed(2) + ' s' : 'never');
  ok('no second event on the plateau or the dip', events(st, n0).length === 1, `events ${events(st, n0).length}`);
}

console.log('4. a creep is not a shift; a second step re-levels');
{
  const st = mk();
  st.run(18, 0.2);
  const n0 = st.out.length;
  st.run(8, (t) => 0.2 + 0.35 * t / 8);   // +.35 over 4 bars: never +.3 inside one bar
  ok('a creep of STEP over 4 bars never fires', events(st, n0).length === 0, `events ${events(st, n0).length}`);
  const st2 = mk();
  st2.run(18, 0.1); st2.run(5, 0.78);
  const a = events(st2).length;
  st2.run(1, 0.45);   // a dip inside the hold (.45 >= .5 x .78): held
  st2.run(5, 1.0);    // +.55 over the bar, after REFR: a second shift re-levels to 1.0 (Comptine 2:00: the ladder dips to .5 and climbs to .85 inside the 1:49 hold)
  ok('a second step after REFR fires again (re-levels)', a === 1 && events(st2).length === 2, `events ${events(st2).length}`);
  st2.run(1, 0.5);   // .5 >= .5 x 1.0: still held
  ok('... and the hold is measured against the NEW level', st2.out[st2.out.length - 1].hold === 1, `hold ${st2.out[st2.out.length - 1].hold}`);
  st2.run(3, 0.4);
  ok('... so .4 (under .5) releases it', st2.out[st2.out.length - 1].hold === 0, `hold ${st2.out[st2.out.length - 1].hold}`);
}

console.log('5. a confirmed drop is a shift the stage does not double');
{
  const st = mk();
  st.run(18, 0.3);
  const n0 = st.out.length;
  st.run(3, 0.9, { drop: 1 });   // the slam frame: the ladder jumps and the drop is confirmed on the same frame
  ok('the drop levels the hold with no shiftEvt', holdFrames(st, n0) === st.out.length - n0 && events(st, n0).length === 0, `held ${holdFrames(st, n0)} events ${events(st, n0).length}`);
  st.run(1, 1.0);   // still inside REFR (2 bars = 4 s): a further step does not fire
  ok(`no shift within REFR ${SHIFT.REFR} bars of the drop`, events(st, n0).length === 0, `events ${events(st, n0).length}`);
  const off = mk({ DROP_LEVELS: 0 });
  off.run(18, 0.3); const m0 = off.out.length; off.run(1, 0.9, { drop: 1 });
  ok('DROP_LEVELS 0: the drop is ignored and the step itself fires', events(off, m0).length === 1, `events ${events(off, m0).length}`);
}

console.log('5b. no shift while the live detector is armed');
{
  const st = mk();
  st.run(18, 0.2);
  const n0 = st.out.length;
  for (let f = 0; f < 120; f++) { st.B += bps * dt; st.out.push(Object.assign({ B: st.B, t: st.out.length * dt }, st.s.step({ B: st.B, bpm: BPM, ok: true, lad: 0.9, drop: 0, armed: 1, dt }))); }
  ok('a step while armed does not fire (the slam will name it)', st.out.filter((o, i) => i >= n0 && o.shiftEvt).length === 0, `events ${st.out.filter((o, i) => i >= n0 && o.shiftEvt).length}`);
  const off = mk({ ARMED: 0 });
  off.run(18, 0.2);
  for (let f = 0; f < 120; f++) { off.B += bps * dt; off.out.push(Object.assign({ B: off.B, t: off.out.length * dt }, off.s.step({ B: off.B, bpm: BPM, ok: true, lad: 0.9, drop: 0, armed: 1, dt }))); }
  ok('ARMED 0: it fires', off.out.filter((o) => o.shiftEvt).length === 1, `events ${off.out.filter((o) => o.shiftEvt).length}`);
}

console.log('6. silence and a seek');
{
  const st = mk();
  st.run(18, 0.2); st.run(2, 0.8);
  ok('(held before the silence)', st.out[st.out.length - 1].hold === 1, '');
  st.run(1, 0.8, { ok: false });
  ok('silence clears the hold', st.out[st.out.length - 1].hold === 0, `hold ${st.out[st.out.length - 1].hold}`);
  const n0 = st.out.length;
  st.run(3, 0.8);
  ok('... and the ring: the music coming back at the same level is not a step (MIN_HIST again)', events(st, n0).length === 0, `events ${events(st, n0).length}`);
  const sk = mk();
  sk.run(18, 0.2);
  sk.B += 40;   // a seek of 40 beats
  const m0 = sk.out.length;
  sk.run(1, 0.9);
  ok('a seek resets: the step right after it does not fire (no history)', events(sk, m0).length === 0, `events ${events(sk, m0).length}`);
}

console.log('7. the slam\'s confirmation (build/confirm.js)');
{
  const k = Object.assign({}, BUILD, { SUB_BACK: 0.5, LEVEL: 0.5, PEND: 4 });
  const c = new Confirm(k);
  ok('not pending: step is 0', c.step(0, 1, 1) === 0 && !c.pending, '');
  c.arm(10);
  ok('pending after arm; a second arm keeps the first', (c.arm(11), c.pending && c.B === 10), `B ${c.B}`);
  ok('the sub out: waits', c.step(10.1, 0, 0.9) === 0, '');
  ok('the sub back, the ladder low: waits', c.step(10.2, 1, 0.3) === 0, '');
  ok('both hold: releases (1) and clears', c.step(10.3, 1, 0.6) === 1 && !c.pending, '');
  c.arm(20);
  ok('PEND beats without them: dropped (−1) and clears', c.step(24.1, 0, 0.2) === -1 && !c.pending, '');
  c.arm(30);
  ok('a NaN ladder (no loud stage): the sub alone releases', c.step(30.1, 1, NaN) === 1, '');
  const off = new Confirm(Object.assign({}, k, { SUB_BACK: 0, LEVEL: 0 }));
  off.arm(1);
  ok('SUB_BACK 0 / LEVEL 0: releases at once (the pre-§143 slam)', off.step(1, 0, 0) === 1, '');
}

console.log(FAIL ? `test_shift: ${FAIL} FAIL` : 'test_shift: OK');
process.exit(FAIL ? 1 : 0);
