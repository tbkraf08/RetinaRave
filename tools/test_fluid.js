// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// Solver after Pavel Dobryakov, WebGL-Fluid-Simulation (MIT, 2017) — https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
// Node test of the fluid substrate's injection grammar (assets/core/fluid/inject.js — pure, no GL): FLUID-PLAN Step 1's gate.
//   node tools/test_fluid.js        ~0.1 s — what npm test runs
// The cases:
//   feats      every FLUID_FEATS key is a FEATS entry; no pred* / *Vel / dropEvt among them (CONTRACTS §1.18, DECISIONS §76)
//   proxy      plan() on a Proxy of MS that throws on any read outside FLUID_FEATS — a synthetic sweep of 600 frames
//   gate       subGate 0 → no sub emitter splat; subGate 1 → exactly one, at the fifths sector of subNote, y by bassReg
//   kick       kickEvt → one impulse from the floor with dy ∝ sqrt(kickAmp) (radius ×2); the two frames after keep 40 %; none at age 99
//   snare      snareEvt → the two shears, equal and opposite
//   hats       hat2 > .3 → min(3, round(denH)) droplets, seeded by beatCount — the same beat gives the same x, the next beat another
//   drop       dropLiveEvt → dyeDiss DROP_DISS (12) for one beat (60/bpm s on dt), then back to the void mapping; the impulse radius ×4
//   mapdrop    §107: a mapDropEvt frame arms the same clear (file mode's bar line); a dropEvt-only frame does NOT (CONTRACTS §1.18: not a clear)
//   floor      §108: a pad-only frame (mid up, no events) → one dye-only splat at the key's fifths sector, y .5, radius ×2, dx = dy = 0;
//              the knee (mid .1 → nothing); silence → nothing; 120 pad frames → never a velocity; the §107 clear holds it under 5 %
//   chord      §108: the v1 `snare` level rising > CHORD_RISE with no snareEvt → two shears at a third of the snare's force, sized by the
//              rise, then the refractory (a further rise inside CHORD_REF → nothing; after it → again); a held level → nothing; a
//              snareEvt frame → the lane's two shears only, and its own rise on the frame after → nothing; a sub-threshold rise → nothing
//   params     curl 10 + 40·tension; velDiss 0.2 → 3.0 as lpSweep closes (+2·hush); dyeDiss 1 → .05 as buildLive rises; tongueAmbig only while tongueOn 1
//   gain       presence 0 → no splat has any velocity or dye; hush / calm lower it
//   colour     the key hue through keycolour's anchor, linear (every component in [0,1]); more saturated with tonicConf
//   determ     two fresh states on the same sweep → byte-identical output (JSON)
//   breath     the beat's body force: −.35·cos⁴(π·beatPhase) × gain, 0 at phase .5
import { plan, mkState, FLUID_FEATS, K } from '../assets/core/fluid/inject.js';
import { FEATS } from '../assets/engine/feats.js';
import { MS } from '../assets/engine/state.js';
import { sectorPc } from '../assets/math/keycolour.js';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('ok   ' + m); } else { fail++; console.log('FAIL ' + m); } };
const near = (a, b, tol, m) => ok(Math.abs(a - b) <= tol, `${m}: ${a} vs ${b} (tol ${tol})`);
const DT = 1 / 60;

// A full MS with the defaults (every field present), overridden per case. loud / present / a key, so the gain is not 0.
const base = (o = {}) => Object.assign({}, MS, { presence: 1, loudRel: 1, hush: 0, calm: 0, key: 0, mode: 0, keyConf: 0.8, tonicConf: 0.7, valence: 0.5, harmAngle: 0,
  modeShade: 0, tension: 0.3, lpSweep: 0.2, buildLive: 0, tongueAmbig: 0, tongueOn: 1, bpm: 120, beatPhase: 0.5, beatCount: 10, seed: { hue: 0.6, th: 0, a: 0.3, scene: -1 },
  subGate: 0, subNote: -1, subGlide: 0, subHz: 0, bassReg: 0, kickEvt: false, kickAmp: 0, kickAge: 99, snareEvt: false, snareAmp: 0, hat2: 0, denH: 0, dropLiveEvt: false }, o);
const run = (S, st = mkState()) => plan(S, DT, st, 0.6);

// feats
{
  const undecl = FLUID_FEATS.filter((k) => !(k in FEATS));
  ok(undecl.length === 0, 'feats: every FLUID_FEATS key in FEATS' + (undecl.length ? ' — missing ' + undecl.join(',') : ' (' + FLUID_FEATS.length + ')'));
  const banned = FLUID_FEATS.filter((k) => /^pred|Vel$|^dropEvt$/.test(k));
  ok(banned.length === 0, 'feats: no pred* / *Vel / dropEvt read' + (banned.length ? ' — ' + banned.join(',') : ''));
}

// proxy: a synthetic 600-frame sweep through a Proxy that throws on any undeclared read
{
  const allowed = new Set(FLUID_FEATS);
  let reads = 0, thrown = null;
  const guard = (S) => new Proxy(S, { get(t, k) { if (typeof k === 'string' && !allowed.has(k)) throw new Error('undeclared read ' + k); reads++; return t[k]; } });
  const st = mkState();
  try {
    for (let i = 0; i < 600; i++) {
      const S = base({ subGate: i % 7 < 4 ? 1 : 0, subNote: i % 12, subHz: 40 + i % 60, bassReg: (i % 10) / 10, subGlide: (i % 5) - 2, kickEvt: i % 30 === 0, kickAmp: 0.6, kickAge: i % 30 === 0 ? 0 : (i % 30) / 60,
        snareEvt: i % 30 === 15, snareAmp: 0.5, hat2: i % 8 < 3 ? 0.8 : 0, denH: 2 + i % 3, beatCount: Math.floor(i / 30), beatPhase: (i % 30) / 30, dropLiveEvt: i === 300,
        tension: (i % 100) / 100, lpSweep: (i % 50) / 50, buildLive: i > 200 && i < 300 ? (i - 200) / 100 : 0, tongueAmbig: 0.4, tongueOn: i % 2, hush: i > 500 ? 0.5 : 0, calm: 0.2 });
      run(guard(S), st);
    }
  } catch (e) { thrown = e.message; }
  ok(thrown === null, 'proxy: 600 frames, no read outside FLUID_FEATS' + (thrown ? ' — ' + thrown : ' (' + reads + ' reads)'));
}

// gate
{
  const off = run(base({ subGate: 0, subNote: 3 }));
  ok(off.splats.length === 0, 'gate: subGate 0 → no splat (' + off.splats.length + ')');
  const on = run(base({ subGate: 1, subNote: 3, bassReg: 0.4, subHz: 50 }));
  ok(on.splats.length === 1, 'gate: subGate 1 → one sub splat (' + on.splats.length + ')');
  const s = on.splats[0];
  near(s.x, (sectorPc(3) + 0.5) / 12, 1e-9, 'gate: x at the fifths sector of the bass note (half a sector in)');
  near(s.y, 0.12 + 0.25 * 0.4, 1e-9, 'gate: y by the register');
  ok(s.dy > 0 && s.dx === 0, 'gate: it rises (dy ' + s.dy.toFixed(4) + '), no lean without a glide');
  const lean = run(base({ subGate: 1, subNote: 3, subGlide: 24 })).splats[0];
  near(lean.dx, K.SUB_X, 1e-9, 'gate: a +24 st/s glide leans it by the full SUB_X');
  const noNote = run(base({ subGate: 1, subNote: -1, harmAngle: Math.PI })).splats[0];
  near(noNote.x, 0.5, 1e-9, 'gate: subNote -1 with the gate open → x from harmAngle (π → .5)');
}

// kick
{
  const a = run(base({ kickEvt: true, kickAmp: 0.25, kickAge: 0 })), b = run(base({ kickEvt: true, kickAmp: 1, kickAge: 0 }));
  ok(a.splats.length === 1 && b.splats.length === 1, 'kick: kickEvt → one impulse');
  near(b.splats[0].dy / a.splats[0].dy, 2, 1e-9, 'kick: dy ∝ sqrt(kickAmp) (amp 1 vs .25 → ×2)');
  near(a.splats[0].dy, K.KICK_V * 0.5, 1e-9, 'kick: dy = KICK_V·sqrt(amp)');
  near(a.splats[0].y, 0.06, 1e-9, 'kick: from the floor');
  near(a.splats[0].rad, K.RADIUS * 2, 1e-12, 'kick: radius ×2');
  const tail = run(base({ kickEvt: false, kickAmp: 1, kickAge: 1 / 60 }));
  ok(tail.splats.length === 1 && Math.abs(tail.splats[0].dy - 0.4 * K.KICK_V) < 1e-9, 'kick: the frame after keeps 40 % (' + (tail.splats.length ? tail.splats[0].dy.toFixed(3) : 'none') + ')');
  const late = run(base({ kickEvt: false, kickAmp: 1, kickAge: 3 / 60 }));
  ok(late.splats.length === 0, 'kick: nothing 3 frames after');
  ok(run(base({ kickAge: 99 })).splats.length === 0, 'kick: nothing before any kick (age 99)');
}

// snare
{
  const r = run(base({ snareEvt: true, snareAmp: 0.5 }));
  ok(r.splats.length === 2, 'snare: two shears (' + r.splats.length + ')');
  if (r.splats.length === 2) {
    const [l, rr] = r.splats;
    ok(l.x === 0.3 && rr.x === 0.7 && l.y === 0.5 && rr.y === 0.5, 'snare: at (.3, .5) and (.7, .5)');
    near(l.dx, -rr.dx, 1e-12, 'snare: equal and opposite');
    near(l.dx, K.SNARE_V * 0.5, 1e-9, 'snare: dx = SNARE_V·snareAmp');
  }
}

// hats
{
  const r3 = run(base({ hat2: 0.8, denH: 2.6 })), r1 = run(base({ hat2: 0.8, denH: 1.2 })), r0 = run(base({ hat2: 0.2, denH: 3 })), r5 = run(base({ hat2: 0.8, denH: 7 }));
  ok(r3.splats.length === 3 && r1.splats.length === 1 && r0.splats.length === 0 && r5.splats.length === 3, `hats: min(3, round(denH)) while hat2 > .3 (${r3.splats.length} ${r1.splats.length} ${r0.splats.length} ${r5.splats.length})`);
  ok(r3.splats.every((s) => s.y === 0.9 && s.dy < 0 && s.x >= 0 && s.x < 1), 'hats: from the surface, falling, x in [0, 1)');
  const again = run(base({ hat2: 0.8, denH: 2.6 }));
  ok(again.splats.map((s) => s.x).join() === r3.splats.map((s) => s.x).join(), 'hats: the same beat → the same x (seeded)');
  const next = run(base({ hat2: 0.8, denH: 2.6, beatCount: 11 }));
  ok(next.splats.map((s) => s.x).join() !== r3.splats.map((s) => s.x).join(), 'hats: the next beat → another x');
  near(r3.splats[0].rad, K.RADIUS * 0.5, 1e-12, 'hats: radius ×.5');
}

// drop
{
  const st = mkState();
  const d = run(base({ dropLiveEvt: true, bpm: 120 }), st);
  ok(d.splats.length === 1 && d.splats[0].rad === K.RADIUS * 4 && d.splats[0].dy === K.DROP_V, 'drop: one impulse, radius ×4, dy DROP_V');
  ok(d.params.dyeDiss === K.DROP_DISS, 'drop: dyeDiss ' + d.params.dyeDiss + ' on the frame');
  let n = 0, p;
  do { p = run(base({ buildLive: 0 }), st); n++; } while (p.params.dyeDiss === K.DROP_DISS && n < 100);
  near(n, 30, 1, 'drop: the clear lasts one beat at 120 bpm (' + n + ' frames)');
  ok(p.params.dyeDiss === 1, 'drop: then back to the void mapping (' + p.params.dyeDiss + ')');
}

// mapdrop (§107): the map's bar line arms the clear exactly as the live detector does; the extractor's dropEvt never does
{
  const st = mkState();
  const m = run(base({ mapDropEvt: true, dropLiveEvt: false, bpm: 120 }), st);
  ok(m.splats.length === 1 && m.splats[0].rad === K.RADIUS * 4 && m.params.dyeDiss === K.DROP_DISS, 'mapdrop: a mapDropEvt frame arms the clear (dyeDiss ' + m.params.dyeDiss + ', ' + m.splats.length + ' splat)');
  let n = 0, p;
  do { p = run(base(), st); n++; } while (p.params.dyeDiss === K.DROP_DISS && n < 100);
  near(n, 30, 1, 'mapdrop: the same one-beat countdown (' + n + ' frames)');
  const both = run(base({ mapDropEvt: true, dropLiveEvt: true }), mkState());
  ok(both.splats.length === 1, 'mapdrop: both on one frame → still one impulse');
  const e = run(base({ dropEvt: true, dropStrength: 1 }), mkState());
  ok(e.splats.length === 0 && e.params.dyeDiss === 1, 'mapdrop: a dropEvt-only frame does NOT arm it (dyeDiss ' + e.params.dyeDiss + ', ' + e.splats.length + ' splats)');
  ok(!FLUID_FEATS.includes('dropEvt') && FLUID_FEATS.includes('mapDropEvt'), 'mapdrop: FLUID_FEATS has mapDropEvt and not dropEvt');
  ok(K.DROP_DISS === 12 && Math.pow(1 / (1 + K.DROP_DISS * DT), 24) < 0.02, 'mapdrop: DROP_DISS 12 keeps < 2 % of the ink after 24 frames (' + Math.pow(1 / (1 + K.DROP_DISS * DT), 24).toFixed(4) + ')');
}

// floor (§108): the harmonic floor — dye only, at the key's sector, knee'd on mid, nothing in silence
{
  const p = run(base({ mid: 0.9, key: 4 }));
  ok(p.splats.length === 1, 'floor: a pad-only frame → one splat (' + p.splats.length + ')');
  if (p.splats.length === 1) {
    const s = p.splats[0];
    ok(s.dx === 0 && s.dy === 0, 'floor: dye only — dx ' + s.dx + ' dy ' + s.dy);
    ok(s.r + s.g + s.b > 0, 'floor: it inks (' + (s.r + s.g + s.b).toFixed(4) + ')');
    near(s.x, (sectorPc(4) + 0.5) / 12, 1e-9, 'floor: x at the KEY\'s fifths sector (half a sector in)');
    near(s.y, 0.5, 1e-9, 'floor: y at mid height');
    near(s.rad, K.RADIUS * 2, 1e-12, 'floor: radius ×2');
    near(p.floor, K.FLOOR_DYE * 0.9, 1e-9, 'floor: FLOOR_DYE·mid·g·f above the knee (' + p.floor.toFixed(5) + ')');
  }
  ok(run(base({ mid: 0.1 })).splats.length === 0 && run(base({ mid: 0.1 })).floor === 0, 'floor: mid .1 is under the knee → nothing');
  ok(run(base({ mid: 0 })).splats.length === 0, 'floor: mid 0 → nothing');
  const q = run(base({ mid: 0.9, presence: 0 }));
  ok(q.splats.length === 0 && q.floor === 0, 'floor: silence (presence 0) → nothing (' + q.splats.length + ' splats)');
  ok(run(base({ mid: 0.9, mode: 0, key: 4 })).floor < run(base({ mid: 0.9, key: 4, loudRel: 1 })).floor + 1e-12 && run(base({ mid: 0.9, hush: 1 })).floor < run(base({ mid: 0.9 })).floor, 'floor: rides the gain (hush lowers it)');
  const st = mkState();
  let vel = 0, n = 0;
  for (let i = 0; i < 120; i++) { const r = run(base({ mid: 0.6 + 0.3 * Math.sin(i / 7), key: i % 12, beatPhase: (i % 30) / 30 }), st); for (const s of r.splats) { n++; vel += Math.abs(s.dx) + Math.abs(s.dy); } }
  ok(n === 120 && vel === 0, 'floor: 120 pad frames → 120 splats, Σ|v| ' + vel + ' (never a velocity: no roster trail moves)');
  const hold = K.FLOOR_DYE * (1 + K.DROP_DISS * DT) / (K.DROP_DISS * DT);
  ok(hold < 0.05, 'floor: under the §107 clear the pool holds ' + hold.toFixed(4) + ' of the floor\'s ink (< .05)');
}

// chord (§108): a chord attack the lane does not call a snare — the v1 `snare` level's rise, with a refractory
{
  near(K.CHORD_V, K.SNARE_V * 0.3, 1e-12, 'chord: CHORD_V is a third of SNARE_V (' + K.CHORD_V + ')');
  const st = mkState();
  run(base({ snare: 0 }), st);
  const c = run(base({ snare: 0.5 }), st);
  ok(c.splats.length === 2 && c.chord > 0, 'chord: a rise 0 → .5 with no snareEvt → two shears (' + c.splats.length + ', chord ' + c.chord + ')');
  if (c.splats.length === 2) {
    const [l, r] = c.splats;
    ok(l.x === 0.3 && r.x === 0.7 && l.y === 0.5 && r.y === 0.5, 'chord: at (.3, .5) and (.7, .5), as the snare');
    near(l.dx, -r.dx, 1e-12, 'chord: equal and opposite');
    near(l.dx, K.CHORD_V * 0.5, 1e-9, 'chord: dx = CHORD_V·Δsnare');
    near(l.r + l.g + l.b, (K.CHORD_DYE * 0.5) * (c.colour[0] + c.colour[1] + c.colour[2]), 1e-9, 'chord: ink CHORD_DYE·Δsnare in the key colour');
  }
  const again = run(base({ snare: 0.9 }), st);
  ok(again.splats.length === 0 && again.chord === 0, 'chord: a further rise .5 → .9 one frame later → nothing (the refractory)');
  let n = 0; while (n < 20 && run(base({ snare: 0.9 }), st).chord === 0 && n++ < 20) { if (n >= Math.ceil(K.CHORD_REF / DT)) break; }
  const late = run(base({ snare: 1.0 }), st); // a rise after the refractory → fires
  ok(late.splats.length === 2 && Math.abs(late.chord - 0.1) < 1e-9, 'chord: a rise after CHORD_REF → fires again (Δ ' + late.chord.toFixed(2) + ')');
  const st2 = mkState();
  let fired = 0; for (let i = 0; i < 60; i++) fired += run(base({ snare: 0.6 }), st2).chord > 0 ? 1 : 0;
  ok(fired === 1, 'chord: a level held at .6 for 60 frames → one shear, then nothing (' + fired + ')');
  const st3 = mkState();
  run(base({ snare: 0 }), st3);
  const ev = run(base({ snare: 0.7, snareEvt: true, snareAmp: 0.5 }), st3);
  ok(ev.splats.length === 2 && ev.chord === 0 && Math.abs(ev.splats[0].dx - K.SNARE_V * 0.5) < 1e-9, 'chord: a snareEvt frame → the lane\'s two shears only (dx ' + ev.splats[0].dx.toFixed(3) + ')');
  const after = run(base({ snare: 0.9 }), st3);
  ok(after.splats.length === 0, 'chord: the level\'s own rise on the frame after a snareEvt → nothing (the event armed the refractory)');
  const st4 = mkState();
  run(base({ snare: 0.3 }), st4); run(base({ snare: 0.3 }), st4); run(base({ snare: 0.3 }), st4); run(base({ snare: 0.3 }), st4); run(base({ snare: 0.3 }), st4);
  for (let i = 0; i < 12; i++) run(base({ snare: 0.3 }), st4);
  const small = run(base({ snare: 0.34 }), st4);
  ok(small.splats.length === 0, 'chord: a rise of .04 (< CHORD_RISE .05) → nothing');
  const st5 = mkState();
  run(base({ snare: 0, presence: 0 }), st5);
  const silent = run(base({ snare: 0.8, presence: 0 }), st5);
  ok(silent.splats.length === 0 && silent.chord === 0, 'chord: silence (presence 0) → nothing');
  ok(FLUID_FEATS.includes('mid') && FLUID_FEATS.includes('snare') && !FLUID_FEATS.includes('hit') && !FLUID_FEATS.includes('eS'), 'chord/floor: FLUID_FEATS gained mid and snare (' + FLUID_FEATS.length + ')');
}

// params
{
  near(run(base({ tension: 0 })).params.curl, 10, 1e-9, 'params: curl 10 at tension 0');
  near(run(base({ tension: 1 })).params.curl, 50, 1e-9, 'params: curl 50 at tension 1');
  near(run(base({ lpSweep: 0.5 })).params.velDiss, 0.2, 1e-9, 'params: velDiss .2 with the filter open');
  near(run(base({ lpSweep: 1 })).params.velDiss, 3.0, 1e-9, 'params: velDiss 3 with the filter closed');
  near(run(base({ lpSweep: 0, hush: 1 })).params.velDiss, 2.2, 1e-9, 'params: +2·hush');
  near(run(base({ buildLive: 0 })).params.dyeDiss, 1, 1e-9, 'params: dyeDiss 1 outside the void');
  near(run(base({ buildLive: 1 })).params.dyeDiss, 0.05, 1e-9, 'params: dyeDiss .05 deep in the void');
  near(run(base({ tongueAmbig: 1, tongueOn: 1 })).params.dyeDiss, 0.05, 1e-9, 'params: tongueAmbig counts while tongueOn 1');
  near(run(base({ tongueAmbig: 1, tongueOn: 0 })).params.dyeDiss, 1, 1e-9, 'params: not while warming');
  ok(run(base()).params.pressure === 0.8 && run(base()).params.radius === K.RADIUS, 'params: pressure .8, radius K.RADIUS');
}

// gain
{
  const q = run(base({ presence: 0, subGate: 1, subNote: 0, kickEvt: true, kickAmp: 1, snareEvt: true, snareAmp: 1 }));
  ok(q.gain === 0 && q.splats.every((s) => s.dx === 0 && s.dy === 0 && s.r === 0 && s.g === 0 && s.b === 0), 'gain: presence 0 → nothing moves, nothing is inked');
  const full = run(base()).gain, hushed = run(base({ hush: 1 })).gain, calm = run(base({ calm: 1 })).gain, soft = run(base({ loudRel: 0 })).gain;
  ok(full === 1 && Math.abs(hushed - 0.2) < 1e-9 && Math.abs(calm - 0.5) < 1e-9 && Math.abs(soft - 0.3) < 1e-9, `gain: 1 / hush .2 / calm .5 / quiet .3 (${full} ${hushed.toFixed(2)} ${calm} ${soft.toFixed(2)})`);
}

// colour
{
  const c = run(base()).colour;
  ok(c.length === 3 && c.every((x) => x >= 0 && x <= 1), 'colour: linear rgb in [0, 1] (' + c.map((x) => x.toFixed(3)).join(' ') + ')');
  const sat = (col) => Math.max(...col) - Math.min(...col);
  const lo = run(base({ tonicConf: 0 })).colour, hi = run(base({ tonicConf: 1 })).colour;
  ok(sat(hi) > sat(lo), 'colour: more saturated with tonicConf (' + sat(lo).toFixed(3) + ' → ' + sat(hi).toFixed(3) + ')');
  const st = mkState();
  for (let i = 0; i < 300; i++) run(base({ key: 7 }), st);
  const g = run(base({ key: 7 }), st).colour;
  const st2 = mkState();
  for (let i = 0; i < 300; i++) run(base({ key: 0 }), st2);
  const c0 = run(base({ key: 0 }), st2).colour;
  ok(g.join() !== c0.join(), 'colour: another key, another hue');
}

// determ
{
  const sweep = (st) => { const out = []; for (let i = 0; i < 400; i++) out.push(run(base({ subGate: i % 3 ? 1 : 0, subNote: i % 12, kickEvt: i % 25 === 0, kickAmp: 0.7, hat2: i % 6 < 2 ? 0.9 : 0, denH: 2.4, beatCount: i >> 4, beatPhase: (i % 16) / 16, dropLiveEvt: i === 200, tension: (i % 37) / 37, mid: 0.3 + 0.6 * ((i % 50) / 50), snare: i % 20 === 0 ? 0.6 : 0.6 * Math.exp(-(i % 20) / 8) }), st)); return JSON.stringify(out); };
  const a = sweep(mkState()), b = sweep(mkState());
  ok(a === b, 'determ: two fresh states on the same 400-frame sweep → identical output (' + a.length + ' chars)');
}

// breath
{
  near(run(base({ beatPhase: 0 })).body, -K.BODY, 1e-9, 'breath: −BODY at the beat');
  near(run(base({ beatPhase: 0.5 })).body, 0, 1e-9, 'breath: 0 at phase .5');
  near(run(base({ beatPhase: 0, hush: 1 })).body, -K.BODY * 0.2, 1e-9, 'breath: rides the gain');
}

console.log(`test_fluid: ${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
