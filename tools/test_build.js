// Node test for assets/engine/build (the live build / drop detector, live step 4 B.2) on synthetic input, one frame per
// 1/60 s at 120 BPM (2 beats / s, a bar = 2 s):
//   · steady music never arms (hp 0, bass level flat) — and nothing arms before MIN_HIST s of music
//   · a void (hp on, bass pulled) arms on a bar line, the level ramps with the void's length, dropLiveIn counts to the bar line
//   · the slam — a low onset on a beat line with the bass back — fires dropLiveEvt on that frame and disarms (level 0)
//   · an off-beat onset, or one with the bass still out, does not fire; nothing fires when not armed
//   · silence disarms (the level decays), a seek resets, a void with no slam times out after MAX bars
//   · THE SUB VOID (§64 task 2): the sub gate shut for SUBV_HOLD bars arms with the BASS STILL IN (which the void path
//     above cannot see), not before, and its slam is the sub coming back at SUBV_RET x its own 2 s mean with no
//     SLAM_AFTER wait; an absent subGate in the input means "the sub is there" and leaves the detector as it was
//   · THE AMBIGUITY (§77): the tongues' tension held >= AMB_ARM for AMB_HOLD beats arms with the bass AND the sub still in
//     (Vienna's dream: 7 bars at 1.0), a dense unambiguous train (CyborgNinja's hats: tension 0.32) never does, a run
//     shorter than the hold does not, the tongues stage OFF (tongueOn -1) is inert, and the slam is the sub-void's
//   node tools/test_build.js
import { Build, BUILD } from '../assets/engine/build/build.js';

let FAIL = 0;
const ok = (name, pass, value) => { if (!pass) FAIL++; console.log('  ' + (pass ? 'pass' : 'FAIL') + '  ' + name.padEnd(66) + value); };
const dt = 1 / 60, BPM = 120, bps = BPM / 60;

// a synthetic stream: run(seconds, { hp, bassS, sub, ok, onsets: (B) => [x...] }) advances the clock; every output is logged
function mk(knobs) {
  const b = new Build(knobs ? Object.assign({}, BUILD, knobs) : BUILD), st = { b, B: 0, out: [] };
  st.run = (secs, p = {}) => {
    const n = Math.round(secs / dt);
    let last = null;
    for (let f = 0; f < n; f++) {
      const B0 = st.B; st.B += bps * dt;
      const ons = [];
      if (p.onBeat && Math.floor(st.B) > Math.floor(B0)) ons.push({ x: Math.floor(st.B) });          // an onset ON each beat line
      if (p.pickup && Math.floor(st.B + 0.14) > Math.floor(B0 + 0.14)) ons.push({ x: Math.floor(st.B + 0.14) - 0.14 });   // §147: a pickup .14 beats BEFORE each line
      if (p.late && Math.floor(st.B - 0.1) > Math.floor(B0 - 0.1)) ons.push({ x: Math.floor(st.B - 0.1) + 0.1 });   // §147: the kick .1 beats AFTER each line
      if (p.offBeat && Math.floor(st.B - 0.5) > Math.floor(B0 - 0.5)) ons.push({ x: Math.floor(st.B - 0.5) + 0.5 });   // on the off-beat
      const i = { B: st.B, rel: st.B, bpm: p.bpm || BPM, ok: p.ok === undefined ? true : p.ok, hp: p.hp || 0, bassS: p.bassS === undefined ? 0.5 : p.bassS,
        sub: p.sub === undefined ? 0.5 : p.sub, anchor: -1, onsets: ons, dt };
      if (p.subGate !== undefined) i.subGate = p.subGate;
      if (p.gateFrom !== undefined) i.subGate = st.B >= p.gateFrom ? 1 : 0;   // §147: the gate opens at a beat position
      if (p.tongueAmbig !== undefined) { i.tongueAmbig = p.tongueAmbig; i.tongueOn = p.tongueOn === undefined ? 1 : p.tongueOn; }
      if (p.shift) i.shift = f === 0 ? 1 : 0;   // §147: the engine's shiftEvt on this run's first frame
      if (p.lad !== undefined) i.lad = p.lad;
      const o = b.step(i);
      last = { B: st.B, buildLive: o.buildLive, dropLiveIn: o.dropLiveIn, dropLiveEvt: o.dropLiveEvt };
      st.out.push(last);
    }
    return last;
  };
  return st;
}
const armedAt = (st, from) => st.out.find((o, i) => i >= from && o.buildLive >= BUILD.L0 - 1e-9);
const armedSh = (st, from) => st.out.find((o, i) => i >= from && o.dropLiveIn >= 0);   // §147: a shift arm sits at SHIFT_L0, under L0 — armed = dropLiveIn counting
const fired = (st, from = 0) => st.out.filter((o, i) => i >= from && o.dropLiveEvt);

console.log('steady music');
{
  const st = mk();
  const o = st.run(60, { hp: 0, bassS: 0.5, onBeat: true });
  ok('60 s of steady music with a kick on every beat: never armed, no event', !armedAt(st, 0) && !fired(st).length && o.dropLiveIn === -1, `buildLive ${o.buildLive} dropLiveIn ${o.dropLiveIn}`);
  const st2 = mk();
  st2.run(10, { bassS: 0.5 }); st2.run(10, { hp: 0.6, bassS: 0.02, sub: 0.02 });
  ok(`a void inside the first ${BUILD.MIN_HIST} s of music does not arm`, !armedAt(st2, 0), `buildLive ${st2.out[st2.out.length - 1].buildLive}`);
}
console.log('a void, then the slam');
{
  const st = mk();
  st.run(40, { bassS: 0.5, sub: 0.5 });                       // the history
  const n0 = st.out.length;
  st.run(6, { hp: 0.6, bassS: 0.02, sub: 0.02, onBeat: true });   // 3 bars of void with a (bass-less) kick on every beat
  const a = armedAt(st, n0), last = st.out[st.out.length - 1];
  ok('armed within the void', !!a, a ? `at B ${a.B.toFixed(2)}` : 'never');
  ok('armed on a bar line (B - phase a multiple of 4, within a frame)', !!a && Math.abs(a.B - Math.round(a.B / 4) * 4) < bps * dt + 1e-9, a ? `B ${a.B.toFixed(3)}` : '');
  ok('the level starts at L0 and ramps with the void', !!a && a.buildLive >= BUILD.L0 && last.buildLive > a.buildLive + 0.1 && last.buildLive <= 1, `${a && a.buildLive.toFixed(2)} -> ${last.buildLive.toFixed(2)}`);
  ok('dropLiveIn counts down to the bar line (0 < x <= 4)', last.dropLiveIn > 0 && last.dropLiveIn <= 4, `${last.dropLiveIn.toFixed(2)}`);
  ok('the void\'s bass-less kicks never fired', fired(st, n0).length === 0, `${fired(st, n0).length} events`);
  // the slam: on the next beat line, the bass back
  const n1 = st.out.length;
  st.run(0.6, { hp: 0.6, bassS: 0.5, sub: 0.5, onBeat: true });
  const ev = fired(st, n1);
  ok('the slam (an on-beat onset with the bass back) fires exactly once', ev.length === 1, `${ev.length} events`);
  ok('it fires on the onset\'s frame (the confirmation was already there)', ev.length === 1 && Math.abs(ev[0].B - Math.round(ev[0].B)) < bps * dt + 1e-9, ev[0] ? `B ${ev[0].B.toFixed(3)}` : '');
  ok('the slam disarms: level 0, dropLiveIn -1 on the event frame', ev.length === 1 && ev[0].buildLive === 0 && ev[0].dropLiveIn === -1, ev[0] ? `${ev[0].buildLive} ${ev[0].dropLiveIn}` : '');
  const n2 = st.out.length;
  st.run(3, { hp: 0.6, bassS: 0.5, sub: 0.5, onBeat: true });    // hp's 5 s mean is still up after the slam
  ok('no re-arm while the void evidence is only lingering (hp mean still up, bass back)', !armedAt(st, n2), `${st.out[st.out.length - 1].buildLive}`);
}
console.log('what does not fire');
{
  const st = mk();
  st.run(40); const n0 = st.out.length;
  st.run(6, { hp: 0.6, bassS: 0.02, sub: 0.02 });
  ok('armed (no onsets at all)', !!armedAt(st, n0), '');
  const n1 = st.out.length;
  st.run(2, { hp: 0.6, bassS: 0.5, sub: 0.5, offBeat: true });   // the bass back, but only off-beat onsets
  ok('an off-beat onset with the bass back does not fire', fired(st, n1).length === 0, `${fired(st, n1).length}`);
  const st2 = mk();
  st2.run(40); st2.run(6, { hp: 0.6, bassS: 0.02, sub: 0.02 });
  const m = st2.out.length;
  st2.run(2, { hp: 0.6, bassS: 0.03, sub: 0.03, onBeat: true }); // on-beat onsets, the bass still out
  ok('an on-beat onset with the bass still out does not fire', fired(st2, m).length === 0, `${fired(st2, m).length}`);
  const st3 = mk();
  st3.run(40, { onBeat: true }); st3.run(2, { hp: 0, bassS: 0.9, sub: 0.9, onBeat: true });
  ok('a bass slam when not armed does not fire', fired(st3).length === 0, `${fired(st3).length}`);
}
console.log('disarm');
{
  const st = mk();
  st.run(40); st.run(6, { hp: 0.6, bassS: 0.02, sub: 0.02 });
  const lv = st.out[st.out.length - 1].buildLive, n1 = st.out.length;
  const o = st.run(2, { hp: 0.6, bassS: 0.02, sub: 0.02, ok: false });   // silence
  ok('silence: dropLiveIn -1 and the level decays', o.dropLiveIn === -1 && o.buildLive < 0.1 * lv, `${lv.toFixed(2)} -> ${o.buildLive.toFixed(3)}`);
  const st2 = mk();
  st2.run(40); st2.run(6, { hp: 0.6, bassS: 0.02, sub: 0.02 });
  st2.B += 100;                                                          // a seek
  const o2 = st2.run(0.1, { hp: 0.6, bassS: 0.02, sub: 0.02 });
  ok('a seek resets: nothing armed', o2.dropLiveIn === -1 && o2.buildLive === 0, `${o2.buildLive} ${o2.dropLiveIn}`);
  const n2 = st2.out.length;
  st2.run(6, { hp: 0.6, bassS: 0.02, sub: 0.02 });
  ok(`after the seek a void does not arm before ${BUILD.MIN_HIST} s of music again`, !armedAt(st2, n2), '');
  const st3 = mk();
  st3.run(40); const n3 = st3.out.length;
  st3.run(2 * (BUILD.MAX + 3), { hp: 0.6, bassS: 0.02, sub: 0.02 });   // a void that never slams
  const a = armedAt(st3, n3), end = st3.out[st3.out.length - 1];
  const dis = st3.out.findIndex((x, i) => i > st3.out.indexOf(a) && x.dropLiveIn === -1);
  ok(`a void with no slam times out after ${BUILD.MAX} bars armed`, !!a && dis > 0 && Math.abs(st3.out[dis].B - a.B - 4 * BUILD.MAX) < 1 && end.dropLiveIn === -1, a ? `armed B ${a.B.toFixed(1)}, disarmed B ${(st3.out[dis] || {}).B?.toFixed(1)}` : 'never armed');
  const st4 = mk();
  st4.run(40); st4.run(6, { hp: 0.6, bassS: 0.02, sub: 0.02 });
  const o4 = st4.run(0.05, { hp: 0.6, bassS: 0.02, sub: 0.02, bpm: 130 });   // a tempo jump
  ok('a tempo jump disarms', o4.dropLiveIn === -1, `${o4.dropLiveIn}`);
}
console.log('the sub void (\u00a764 task 2)');
{
  // The case the void path cannot see: the BASS stays in (bassS flat 0.5, hp 0) and only the SUB leaves.
  const base = { hp: 0, bassS: 0.5, onBeat: true };
  const st = mk();
  st.run(40, Object.assign({ sub: 0.5, subGate: 1 }, base));
  const n0 = st.out.length;
  // the gate's 2 s box mean takes ~1.6 s to fall under SUBV_OFF, so the counted void starts there: 8 s of shut gate
  // is 3.2 bars of it, under the hold, and 14 s is 6.2 — the shape Vienna's own 6.02 bars has.
  st.run(8, Object.assign({ sub: 0.1, subGate: 0 }, base));
  ok(`a sub void shorter than ${BUILD.SUBV_HOLD} bars does not arm`, !armedAt(st, n0), `buildLive ${st.out[st.out.length - 1].buildLive}`);
  st.run(6, Object.assign({ sub: 0.1, subGate: 0 }, base));                              // past the hold
  const a = armedAt(st, n0);
  ok('the sub void arms with the bass still in', !!a, a ? `at B ${a.B.toFixed(2)}` : 'never');
  ok('on a bar line, no earlier than the hold', !!a && Math.abs(a.B - Math.round(a.B / 4) * 4) < bps * dt + 1e-9 && a.B >= 4 * BUILD.SUBV_HOLD - 1e-9,
    a ? `B ${a.B.toFixed(3)}` : '');
  ok('the void\'s bass-less on-beat kicks never fired', fired(st, n0).length === 0, `${fired(st, n0).length} events`);
  // the slam: the SUB comes back at 2.5 x its 2 s mean, with bassS flat (so RET 1.75 cannot fire) and under SUB_RET 5
  const n1 = st.out.length;
  st.run(0.6, Object.assign({ sub: 0.25, subGate: 1 }, base));
  const ev = fired(st, n1);
  ok('the sub coming back on a beat line fires once (bassS flat, under SUB_RET)', ev.length === 1, `${ev.length} events`);
  ok('on the onset\'s own frame, and it disarms', ev.length === 1 && Math.abs(ev[0].B - Math.round(ev[0].B)) < bps * dt + 1e-9 && ev[0].buildLive === 0,
    ev[0] ? `B ${ev[0].B.toFixed(3)} level ${ev[0].buildLive}` : '');
  // the same stream with the path off is the detector as §54 left it: nothing at all
  const off = mk({ SUBV_OFF: 0 });
  off.run(40, Object.assign({ sub: 0.5, subGate: 1 }, base));
  off.run(14, Object.assign({ sub: 0.1, subGate: 0 }, base));
  off.run(0.6, Object.assign({ sub: 0.25, subGate: 1 }, base));
  ok('SUBV_OFF 0: the same stream never arms and never fires', !armedAt(off, 0) && !fired(off).length, `buildLive ${off.out[off.out.length - 1].buildLive}`);
  // an input with no subGate at all (every caller before \u00a764) reads as "the sub is there"
  const none = mk();
  none.run(40, Object.assign({ sub: 0.5 }, base));
  none.run(14, Object.assign({ sub: 0.1 }, base));
  ok('no subGate in the input: the sub void never arms', !armedAt(none, 0), `buildLive ${none.out[none.out.length - 1].buildLive}`);
  // SLAM_AFTER does not gate this path: raised to 4 bars (which would block a slam 8 beats after the arm on the
  // bass/hp path) the sub-void slam still fires, because the void has already run four bars before the arm.
  const late = mk({ SLAM_AFTER: 4 });
  late.run(40, Object.assign({ sub: 0.5, subGate: 1 }, base));
  late.run(14, Object.assign({ sub: 0.1, subGate: 0 }, base));
  const la = armedAt(late, 0), l0 = late.out.length;
  late.run(0.6, Object.assign({ sub: 0.25, subGate: 1 }, base));
  const le = fired(late, l0);
  ok('SLAM_AFTER 4 bars does not gate the sub-void slam', !!la && le.length === 1 && le[0].B - la.B < 4 * 4,
    la && le.length ? `${(le[0].B - la.B).toFixed(2)} beats after the arm` : `${le.length} events`);
}
console.log('the ambiguity (§77)');
{
  // bass and sub both IN, hp 0: neither the void nor the sub void can see anything; the tongues say the beat locks nothing
  const base = { hp: 0, bassS: 0.5, sub: 0.5, subGate: 1, onBeat: true };
  const st = mk();
  st.run(40, Object.assign({ tongueAmbig: 0.45 }, base));                 // a groove: the ladder locks (Vienna 0.4-0.6)
  const n0 = st.out.length;
  st.run(3, Object.assign({ tongueAmbig: 1.0 }, base));                   // 6 beats of full tension: under the hold
  ok(`an ambiguous run shorter than ${BUILD.AMB_HOLD} beats does not arm`, !armedAt(st, n0), `buildLive ${st.out[st.out.length - 1].buildLive}`);
  st.run(11, Object.assign({ tongueAmbig: 1.0 }, base));                  // 7 bars of it in all (the dream)
  const a = armedAt(st, n0);
  ok('7 bars of tongueAmbig 1.0 arm with the bass and the sub still in', !!a, a ? `at B ${a.B.toFixed(2)}` : 'never');
  ok('on a bar line, no earlier than the hold', !!a && Math.abs(a.B - Math.round(a.B / 4) * 4) < bps * dt + 1e-9 && a.B - st.out[n0].B >= BUILD.AMB_HOLD - 1e-9, a ? `B ${a.B.toFixed(3)}` : '');
  const held = st.out[st.out.length - 1];
  ok('the arm HOLDS while the ambiguity lasts (the bass void\'s own gap rule must not release it)', held.dropLiveIn >= 0 && held.buildLive >= BUILD.L0 - 1e-9, `dropLiveIn ${held.dropLiveIn.toFixed(2)} level ${held.buildLive.toFixed(3)}`);
  ok('the on-beat kicks under the ambiguity never fired', fired(st, n0).length === 0, `${fired(st, n0).length} events`);
  const n1 = st.out.length;
  st.run(0.6, Object.assign({}, base, { sub: 1.25, tongueAmbig: 0.4 }));  // the sub at 2.5 x its 2 s mean on a beat line: the sub-void's slam
  const ev = fired(st, n1);
  ok('the sub coming back at SUBV_RET x fires once on the onset\'s frame and disarms', ev.length === 1 && ev[0].buildLive === 0, `${ev.length} events`);
  // the dense unambiguous train: CyborgNinja's 16th hats lock the 4:1 tongue at 0.68 (tension 0.32) all track
  const cn = mk();
  cn.run(120, Object.assign({ tongueAmbig: 0.32 }, base));
  ok('120 s of a dense unambiguous train (tension 0.32) never arms', !armedAt(cn, 0) && !fired(cn).length, `buildLive ${cn.out[cn.out.length - 1].buildLive}`);
  // the ambiguity lifting for more than a beat releases an ambiguity arm (the sub void's own rule)
  const rel = mk();
  rel.run(40, Object.assign({ tongueAmbig: 0.45 }, base)); rel.run(14, Object.assign({ tongueAmbig: 1.0 }, base));
  const ra = armedAt(rel, 0), r0 = rel.out.length;
  rel.run(2, Object.assign({ tongueAmbig: 0.4 }, base));
  ok('the ambiguity gone for a beat releases the arm (no slam, the level decays)', !!ra && rel.out[rel.out.length - 1].dropLiveIn === -1 && !fired(rel, r0).length && rel.out[rel.out.length - 1].buildLive < 0.1, `dropLiveIn ${rel.out[rel.out.length - 1].dropLiveIn} level ${rel.out[rel.out.length - 1].buildLive.toFixed(3)}`);
  // the stage off (tongueOn -1), or the path off, or no field at all: inert
  const off = mk(); off.run(40, Object.assign({ tongueAmbig: 0.45, tongueOn: -1 }, base)); off.run(14, Object.assign({ tongueAmbig: 1.0, tongueOn: -1 }, base));
  const off2 = mk({ AMB_ARM: 0 }); off2.run(40, Object.assign({ tongueAmbig: 0.45 }, base)); off2.run(14, Object.assign({ tongueAmbig: 1.0 }, base));
  const none = mk(); none.run(54, base);
  ok('tongueOn -1 / AMB_ARM 0 / no field: the same stream never arms', !armedAt(off, 0) && !armedAt(off2, 0) && !armedAt(none, 0), `${off.out[off.out.length - 1].buildLive} ${off2.out[off2.out.length - 1].buildLive} ${none.out[none.out.length - 1].buildLive}`);
}
console.log('the shift arm (§147)');
{
  // The Roots' shape: a live band — the bass in (bassS flat .5, hp 0), the sub gate SHUT the whole time (its 32 s mean 0: the sub-void
  // path is rightly closed by SUBV_HAD), the beat locked; the engine's shift fires; four seconds later a kick on the beat with the
  // gate opening on that frame and the sub up — but not by any bass-return ratio (sub .5 → .9, under SUBV_RET 2 and SUB_RET 5).
  const base = { hp: 0, bassS: 0.5, sub: 0.5, subGate: 0, tongueAmbig: 0.45, onBeat: true };
  const st = mk();
  st.run(40, base);
  const n0 = st.out.length;
  st.run(0.5, Object.assign({ shift: 1 }, base));
  const a = armedSh(st, n0), sh0 = st.out[n0];
  ok('a shiftEvt arms at once (not on the bar line) with the bass and the sub in and the gate shut', !!a && a === sh0, a ? `at B ${a.B.toFixed(3)} (the shift's frame B ${sh0.B.toFixed(3)})` : 'never');
  ok(`the level sits at SHIFT_L0 ${BUILD.SHIFT_L0} (under the void's L0 ${BUILD.L0}) and dropLiveIn counts`, !!a && Math.abs(st.out[st.out.length - 1].buildLive - BUILD.SHIFT_L0) < 1e-9 && st.out[st.out.length - 1].dropLiveIn >= 0, `${st.out[st.out.length - 1].buildLive} ${st.out[st.out.length - 1].dropLiveIn.toFixed(2)}`);
  st.run(3.5, base);   // the kicks go on with the gate shut
  ok('on-beat kicks with the gate still shut never fire, and the arm holds (no void to lift)', fired(st, n0).length === 0 && st.out[st.out.length - 1].dropLiveIn >= 0, `${fired(st, n0).length} events, dropLiveIn ${st.out[st.out.length - 1].dropLiveIn.toFixed(2)}`);
  const n1 = st.out.length;
  st.run(0.6, Object.assign({}, base, { sub: 0.9, subGate: 1 }));   // the gate opens on the next beat line's kick
  const ev = fired(st, n1);
  ok('the gate OPENING on an on-beat kick fires once (no bass-return ratio holds) and disarms', ev.length === 1 && ev[0].buildLive === 0 && ev[0].dropLiveIn === -1, `${ev.length} events`);
  ok('on the onset\'s own frame (the gate open and no ladder = §143\'s Confirm releases at once)', ev.length === 1 && Math.abs(ev[0].B - Math.round(ev[0].B)) < bps * dt + 1e-9, ev[0] ? `B ${ev[0].B.toFixed(3)}` : '');
  // the ladder at a quiet level holds the slam PENDING (§143's Confirm) — a shift arm takes the same gate
  const lv = mk();
  lv.run(40, base); lv.run(4, Object.assign({ shift: 1 }, base));
  const l0 = lv.out.length;
  lv.run(0.6, Object.assign({}, base, { sub: 0.9, subGate: 1, lad: 0.2 }));
  ok('…but a ladder under LEVEL holds it pending (nothing fires)', fired(lv, l0).length === 0, `${fired(lv, l0).length} events`);
  // a kit whose gate is OPEN through the shift (a groove getting louder) never slams by the shift: the scene swells on it
  const grv = mk();
  grv.run(40, Object.assign({}, base, { subGate: 1 })); const g0 = grv.out.length;
  grv.run(8, Object.assign({}, base, { subGate: 1, shift: 1 }));
  ok('a shift with the gate already open: armed, the on-beat kicks never fire (the gate did not OPEN)', !!armedSh(grv, g0) && fired(grv, g0).length === 0, `${fired(grv, g0).length} events`);
  // a shift arm with no slam times out after MAX bars
  const to = mk();
  to.run(40, base); const t0 = to.out.length;
  to.run(2 * (BUILD.MAX + 2), Object.assign({ shift: 1 }, base));
  const ta = armedSh(to, t0), dis = to.out.findIndex((x, i) => i > to.out.indexOf(ta) && x.dropLiveIn === -1);
  ok(`a shift arm with no slam times out after ${BUILD.MAX} bars`, !!ta && dis > 0 && Math.abs(to.out[dis].B - ta.B - 4 * BUILD.MAX) < 0.5, ta ? `armed B ${ta.B.toFixed(2)}, disarmed B ${(to.out[dis] || {}).B?.toFixed(2)}` : 'never armed');
  // SHIFT_ARM 0 is v0.44: the same stream never arms; SHIFT_GATE 0: armed, but the gate opening confirms nothing
  const off = mk({ SHIFT_ARM: 0 });
  off.run(40, base); off.run(4, Object.assign({ shift: 1 }, base)); off.run(0.6, Object.assign({}, base, { sub: 0.9, subGate: 1 }));
  const ng = mk({ SHIFT_GATE: 0 });
  ng.run(40, base); ng.run(4, Object.assign({ shift: 1 }, base)); const ng0 = ng.out.length; ng.run(0.6, Object.assign({}, base, { sub: 0.9, subGate: 1 }));
  ok('SHIFT_ARM 0: never armed, nothing fires · SHIFT_GATE 0: armed, the gate opening alone fires nothing (the ratios rule)', !armedSh(off, 0) && !fired(off).length && !!armedSh(ng, 0) && !fired(ng, ng0).length, `${off.out[off.out.length - 1].buildLive} / ${fired(ng, ng0).length}`);
  // The Roots' kicks: a pickup .14 before the line, the drop kick .1 after it (inside ON_BEAT), the gate opening with the kick —
  // the better-aligned onset takes the candidate (CAND_BEST) and the slam lands on the kick's frame, not lost behind the pickup
  const pk = mk();
  pk.run(40, Object.assign({}, base, { onBeat: false, pickup: true, late: true })); pk.run(3.9, Object.assign({}, base, { onBeat: false, pickup: true, late: true, shift: 1 }));
  const pk0 = pk.out.length, gateAt = Math.ceil(pk.B + 0.2) + 0.1; pk.run(0.8, Object.assign({}, base, { onBeat: false, pickup: true, late: true, sub: 0.9, gateFrom: gateAt }));   // the gate opens WITH the kick .1 after the next line
  const pe = fired(pk, pk0);
  ok('a pickup kick .14 before the line does not mask the drop kick .1 after it (SHIFT_LAST): one slam, on the kick', pe.length === 1 && Math.abs(pe[0].B - Math.round(pe[0].B) - 0.1) < bps * dt + 1e-9, pe.length ? `B ${pe[0].B.toFixed(3)}` : '0 events');
  // the bass-return ratios confirm nothing on a shift arm (TheChain 130.7: a chorus's bass swell at 2× its 2 s mean with the gate open)
  const rat = mk();
  rat.run(40, Object.assign({}, base, { subGate: 1 })); rat.run(4, Object.assign({}, base, { subGate: 1, shift: 1 }));
  const rt0 = rat.out.length; rat.run(0.6, Object.assign({}, base, { bassS: 1.0, sub: 0.9, subGate: 1 }));
  ok('a bass swell at 2× its 2 s mean (RET) with the gate open does not slam a shift arm', !!armedSh(rat, 0) && fired(rat, rt0).length === 0, `${fired(rat, rt0).length} events`);
  // the sub was THERE (its 32 s mean over SHIFT_HAD) and dipped for a bar: a fill, not an arrival — nothing fires on its return
  const dip = mk();
  dip.run(40, Object.assign({}, base, { subGate: 1 })); dip.run(3, Object.assign({}, base, { subGate: 0, shift: 1 }));
  const dp0 = dip.out.length; dip.run(0.6, Object.assign({}, base, { sub: 0.9, subGate: 1 }));
  ok(`a sub back from a 3 s dip inside a groove (32 s mean over SHIFT_HAD ${BUILD.SHIFT_HAD}) does not slam a shift arm`, !!armedSh(dip, 0) && fired(dip, dp0).length === 0, `${fired(dip, dp0).length} events`);
  // a shift inside the first MIN_HIST s, or while a void arm is up, changes nothing
  const early = mk(); early.run(10, Object.assign({ shift: 1 }, base)); early.run(1, base);
  const dbl = mk(); dbl.run(40, { hp: 0, bassS: 0.5, sub: 0.5, subGate: 1 }); dbl.run(6, { hp: 0.6, bassS: 0.02, sub: 0.02, subGate: 1 });
  const dl = dbl.out[dbl.out.length - 1].buildLive; dbl.run(0.5, { hp: 0.6, bassS: 0.02, sub: 0.02, subGate: 1, shift: 1 });
  ok(`a shift before ${BUILD.MIN_HIST} s does not arm; a shift over a void arm leaves its level alone`, !armedSh(early, 0) && dbl.out[dbl.out.length - 1].buildLive >= dl - 1e-9, `${early.out[early.out.length - 1].buildLive} / ${dl.toFixed(3)} → ${dbl.out[dbl.out.length - 1].buildLive.toFixed(3)}`);
}
console.log(FAIL ? `test_build: ${FAIL} FAILED` : 'test_build: OK');
process.exit(FAIL ? 1 : 0);
