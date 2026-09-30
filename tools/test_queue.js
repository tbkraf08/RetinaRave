// Node test for assets/engine/queue (the predicted-event queue, live step 5) on synthetic input, one frame per 1/60 s at
// 120 BPM (2 beats / s, a bar = 2 s), and for Bars.upcoming (the store's own list of the steps still to come):
//   · the list is ordered by time; every next*In decreases by dt frame to frame and rolls over at 0 to the next entry
//   · the beat lines: at least the next 4, the first one within a beat; the bar lines on the bar phase given
//   · a step the store withdraws is gone from the list the next frame (HOLD 0); with HOLD (0.25 s, the default) one already inside HOLD stays for its time
//   · a seek, silence and a tempo jump flush the list (every field -1 / 0, queueN 0)
//   · the drop entry follows the build detector: listed while armed, on the next bar line, conf = buildLive
//   · the wind-up levels: 0 until WIND s before the hit, 1 on it, 0 with no entry
//   · Bars.upcoming lists exactly the steps release() will fire (the same bits, the class offsets), none below CONF_MIN
//   node tools/test_queue.js
import { Queue, QUEUE, QUEUE_OUT } from '../assets/engine/queue/queue.js';
import { feed } from '../assets/engine/queue/feed.js';
import { Bars, CONF_MIN, STEPS } from '../assets/engine/bars/bars.js';

let FAIL = 0;
const ok = (name, pass, value) => { if (!pass) FAIL++; console.log('  ' + (pass ? 'pass' : 'FAIL') + '  ' + name.padEnd(70) + (value === undefined ? '' : value)); };
const dt = 1 / 60, BPM = 120, bps = BPM / 60;
const near = (a, b, e = 1e-9) => Math.abs(a - b) <= e;

// a synthetic stream: rel advances bps·dt per frame, T with it; steps are given as absolute grid positions (beats)
function mk(k) {
  const q = new Queue(k ? Object.assign({}, QUEUE, k) : QUEUE), st = { q, rel: 0, T: 100, a: 0, out: [] };
  st.run = (secs, p = {}) => {
    const n = Math.round(secs / dt);
    let last = null;
    for (let f = 0; f < n; f++) {
      st.rel += bps * dt; st.T += dt;
      const steps = (p.steps || []).map((s) => ({ c: s.c, dy: s.y - st.rel, conf: s.conf === undefined ? 0.8 : s.conf })).filter((s) => s.dy > 0);
      const o = q.step({ T: st.T, rel: st.rel, bpm: p.bpm || BPM, ok: p.ok === undefined ? true : p.ok, a: st.a, steps,
        armed: !!p.armed, dropConf: p.armed ? 0.7 : 0, dt });
      last = Object.assign({ T: st.T, rel: st.rel, list: q.list.map((e) => ({ cls: e.cls, t: e.t, conf: e.conf })) }, o);
      st.out.push(last);
    }
    return last;
  };
  return st;
}

console.log('order, count-down, roll-over');
{
  const st = mk();
  const steps = [{ c: 0, y: 1 }, { c: 0, y: 2 }, { c: 1, y: 2 }, { c: 2, y: 1.5 }, { c: 0, y: 3 }];
  st.run(0.2, { steps });
  const L = st.out[st.out.length - 1].list;
  ok('list ordered by t', L.every((e, i) => i === 0 || e.t >= L[i - 1].t), L.map((e) => e.cls).join(' '));
  ok('the first hit is the kick at beat 1', L.find((e) => e.cls !== 'beat' && e.cls !== 'bar').cls === 'kick');
  ok('at least 4 beat lines', L.filter((e) => e.cls === 'beat').length >= 4, L.filter((e) => e.cls === 'beat').length);
  ok('bar lines at 4k (a = 0): the first at beat 4', near(L.find((e) => e.cls === 'bar').t, st.T + (4 - st.rel) / bps, 1e-9));
  // decreases by dt every frame until the roll-over
  st.run(0.6, { steps });
  let steady = 0, total = 0, rolled = false;
  for (let i = 13; i < st.out.length; i++) {
    const a = st.out[i - 1].nextKickIn, b = st.out[i].nextKickIn;
    if (b < a) { total++; if (near(b, a - dt, 1e-6)) steady++; } else rolled = true;
  }
  ok('nextKickIn decreases by dt frame to frame', steady === total && total > 20, steady + '/' + total);
  ok('… and rolls over to the next kick (beat 2) after beat 1', rolled && near(st.out[st.out.length - 1].nextKickIn, (2 - st.rel) / bps, 1e-6), st.out[st.out.length - 1].nextKickIn.toFixed(4));
  ok('nextBeatIn within a beat, >= 0 (0 = on the line)', st.out.every((o) => o.nextBeatIn >= 0 && o.nextBeatIn <= 0.5 + 1e-6), st.out.map((o) => o.nextBeatIn.toFixed(3)).filter((v, i, a) => i < 3 || i > a.length - 3).join(' '));
  ok('queueN counts every entry', st.out[st.out.length - 1].queueN === st.out[st.out.length - 1].list.length);
  ok('nextKickConf is the step\'s conf', near(st.out[st.out.length - 1].nextKickConf, 0.8));
}

console.log('withdrawal and HOLD');
{
  const st = mk({ HOLD: 0 });
  st.run(0.3, { steps: [{ c: 1, y: 1 }] });
  ok('a snare at beat 1 listed', st.out[st.out.length - 1].nextSnareIn > 0);
  const o = st.run(dt, { steps: [] });
  ok('withdrawn by the store -> gone the next frame (HOLD 0)', o.nextSnareIn === -1 && o.nextSnareConf === 0 && o.nextSnareUp === 0, o.nextSnareIn);
  const st2 = mk({ HOLD: 0.25 });
  st2.run(0.3, { steps: [{ c: 1, y: 1 }] });          // rel 0.6 -> the snare 0.4 beat = 0.2 s ahead: inside HOLD
  const o2 = st2.run(dt, { steps: [] });
  ok('HOLD 0.25: an entry inside HOLD stays when withdrawn', o2.nextSnareIn > 0 && near(o2.nextSnareIn, 0.2 - dt, 1e-6), o2.nextSnareIn);
  const o3 = st2.run(0.25, { steps: [] });
  ok('… and passes at its time (nothing after)', o3.nextSnareIn === -1);
  const st3 = mk({ HOLD: 0.25 });
  st3.run(0.1, { steps: [{ c: 1, y: 1.5 }] });        // 1.3 beat = 0.65 s ahead: outside HOLD
  const o4 = st3.run(dt, { steps: [] });
  ok('HOLD 0.25: an entry beyond HOLD is withdrawn', o4.nextSnareIn === -1);
}

console.log('flushes');
{
  const st = mk();
  st.run(0.3, { steps: [{ c: 0, y: 1 }, { c: 2, y: 0.75 }], armed: true });
  ok('listed before the seek', st.out[st.out.length - 1].queueN > 0);
  st.rel += 10;                                          // a seek: rel jumps 10 beats
  let o = st.run(dt, { steps: [{ c: 0, y: 25 }], armed: true });
  ok('a seek flushes (the hit given is beyond the horizon: nothing but lines)', o.nextKickIn === -1 && o.nextBeatIn > 0);
  o = st.run(dt, { steps: [{ c: 0, y: 11 }], ok: false });
  ok('silence: every field none, queueN 0', QUEUE_OUT.every((k) => o[k] === (k === 'queueN' || k.endsWith('Conf') || k.endsWith('Up') ? 0 : -1)), JSON.stringify(o.nextBeatIn));
  o = st.run(dt, { steps: [{ c: 0, y: 11 }] });
  ok('music back: listed again', o.nextKickIn > 0 && o.queueN > 0);
  o = st.run(dt, { steps: [{ c: 0, y: 11 }], bpm: 130 });
  ok('a tempo jump (> 4 %) flushes that frame', o.nextKickIn > 0 && st.q.pBpm === 130, 'rebuilt from the sources on the same frame');
}

console.log('the drop entry');
{
  const st = mk();
  st.a = 1;                                              // bar lines at 1, 5, 9 …
  let o = st.run(0.3, {});
  ok('not armed: no drop entry', o.nextDropIn === -1 && !st.q.list.some((e) => e.cls === 'drop'));
  o = st.run(dt, { armed: true });
  const bar = st.q.list.find((e) => e.cls === 'bar'), drop = st.q.list.find((e) => e.cls === 'drop');
  ok('armed: the drop sits on the next bar line (beat 1)', drop && near(drop.t, bar.t) && near(o.nextDropIn, o.nextBarIn), o.nextDropIn);
  ok('its conf is buildLive', drop && near(drop.conf, 0.7));
  o = st.run(0.5, { armed: true });                      // past beat 1: the next line is 5
  ok('past the line: the entry moves to the next bar line', near(o.nextDropIn, (5 - st.rel) / bps, 1e-6), o.nextDropIn);
  o = st.run(dt, { armed: false });
  ok('disarmed: the entry is gone', o.nextDropIn === -1);
}

console.log('the wind-up levels');
{
  const st = mk();
  const steps = [{ c: 0, y: 2 }];
  st.run(0.5, { steps });                                // rel 1 -> the kick 0.5 s ahead
  let o = st.out[st.out.length - 1];
  ok('0.5 s ahead: nextKickUp 0', o.nextKickUp === 0, o.nextKickUp);
  st.run(0.375, { steps });                              // 0.125 s ahead
  o = st.out[st.out.length - 1];
  ok('0.125 s ahead: nextKickUp 0.5', near(o.nextKickUp, 0.5, 0.05), o.nextKickUp.toFixed(3));
  st.run(0.125 - 2 * dt, { steps });                    // 0.025 s (1.5 frames) ahead
  o = st.out[st.out.length - 1];
  ok('on the hit (within 1.5 frames): nextKickUp ~0.9', o.nextKickUp > 0.85, o.nextKickUp.toFixed(3));
  o = st.run(2 * dt, { steps });
  ok('after it: none -> 0', o.nextKickUp === 0 && o.nextKickIn === -1);
}

console.log('Bars.upcoming = what release() fires');
{
  // a store taught a loop (as test_bars.js does): kick on every beat, snare on 2 and 4, hats on the 8ths; 24 bars
  const bars = new Bars(), into = {};
  const pat = (b) => { const s = b * 4; return [s % 4 === 0 ? 0 : -1, s % 8 === 4 ? 1 : -1, s % 2 === 0 ? 2 : -1].filter((c) => c >= 0); };
  const feat = new Float32Array(12).fill(0.5);
  let B = 0, T = 0, fired = [], listed = new Map();
  const onsets = [];
  for (let f = 0; f < 60 * 2 * 24; f++) {
    const B0 = B; B += bps * dt; T += dt;
    onsets.length = 0;
    for (let g = Math.floor(B0 * 4) + 1; g <= Math.floor(B * 4); g++) for (const c of pat(g / 4)) onsets.push({ c, x: g / 4 });
    const o = bars.step({ B, rel: B, bpm: BPM, ok: true, anchor: -1, onsets, feat, lead: 0.5 * dt * bps, dt });
    if (f > 60 * 2 * 16) {
      const up = bars.upcoming(B, []);
      for (const e of up) { const key = e.c + '@' + (Math.round((B + e.dy) * 32) / 32).toFixed(4); if (!listed.has(key)) listed.set(key, B); }
      if (o.predKickEvt) fired.push('0@' + (Math.round(B * 32) / 32).toFixed(4));
      if (o.predSnareEvt) fired.push('1@' + (Math.round(B * 32) / 32).toFixed(4));
      if (o.predHatEvt) fired.push('2@' + (Math.round(B * 32) / 32).toFixed(4));
      ok.last = up;
    }
  }
  ok('the store predicts on the loop (predConf >= CONF_MIN)', bars.conf >= CONF_MIN, bars.conf.toFixed(3));
  const missed = fired.filter((k) => !listed.has(k));
  ok('every released prediction was listed ahead of its release', fired.length > 40 && missed.length === 0, fired.length + ' fired, ' + missed.length + ' never listed');
  const ahead = fired.filter((k) => listed.has(k)).map((k) => +k.split('@')[1] - listed.get(k));
  ok('… at least a step ahead (median beats)', ahead.length && ahead.sort((a, b) => a - b)[ahead.length >> 1] >= 0.25, ahead.length ? ahead[ahead.length >> 1].toFixed(3) : '-');
  bars.conf = 0;
  ok('below CONF_MIN: nothing predicted is listed', bars.upcoming(B, []).length === 0);
}

console.log('feed: rel = the raw clock moved by the lead and the display lead; armed from the build fields');
{
  const S = { beatCount: 10, beatPhase: 0.5, bpm: 120, presence: 0.8, heardT: 33, buildLive: 0.55, dropLiveIn: 2.5 };
  const bld = { a: 2 }, i = feed(S, -0.04, 0.04, dt, null, bld, {});
  ok('rel = beatCount + beatPhase + (L + disp) · bps', near(i.rel, 10.5 + 0 * 2, 1e-9), i.rel);
  ok('a = the build detector\'s bar phase', i.a === 2);
  ok('armed with dropConf = buildLive', i.armed && near(i.dropConf, 0.55));
  S.dropLiveIn = -1;
  ok('not armed when dropLiveIn is -1', !feed(S, -0.04, 0.04, dt, null, bld, {}).armed);
  S.presence = 0.1;
  ok('presence below the gate: not ok', !feed(S, -0.04, 0.04, dt, null, bld, {}).ok);
}

console.log(FAIL ? `test_queue: ${FAIL} FAILED` : 'test_queue: OK');
process.exit(FAIL ? 1 : 0);
