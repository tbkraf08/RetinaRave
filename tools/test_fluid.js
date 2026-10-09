// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// Solver after Pavel Dobryakov, WebGL-Fluid-Simulation (MIT, 2017) — https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
// Node test of the fluid substrate's injection grammar (assets/core/fluid/inject.js — pure, no GL): FLUID-PLAN Step 1's gate.
//   node tools/test_fluid.js        ~3 s — what npm test runs (the real traces are 16 MB of JSON each)
// The cases — the PURE RULES on hand-made frames (a knee, a refractory, a law: units), then THE MUSIC (§109: every "this behaves
// right on music" claim is tested on the real MS traces of tools/truth/traces/, recorded by tools/traces.sh from every library track
// and the user's pad take — HARNESS "Real-music acceptance"):
//   feats      every FLUID_FEATS key is a FEATS entry; no pred* / *Vel / dropEvt among them (CONTRACTS §1.18, DECISIONS §76)
//   proxy      plan() on a Proxy of MS that throws on any read outside FLUID_FEATS — over SeeYouDrop's 6600 real frames
//   gate       subGate 0 → no sub emitter splat; subGate 1 → exactly one, at the fifths sector of subNote, y by bassReg
//   kick       kickEvt → one impulse from the floor with dy = KICK_V·√(AMP0 + (1 − AMP0)·rank) (radius ×2) — §111 the rank in the lane's own
//              last 64 hits (the prior .3 / .95 until 8): a lane in .5–.6 spreads over the whole law; the two frames after keep 40 %; none at age 99
//   snare      snareEvt → the two shears, equal and opposite, dx = SNARE_V·(AMP0 + (1 − AMP0)·rank)
//   hats       hat2 > .3 → min(3, round(denH)) droplets, seeded by beatCount — the same beat gives the same x, the next beat another;
//              §111 out of a token bucket: 3 tokens, HAT_RATE back per second — a burst's first three, 10 s of hats ≤ HAT_RATE·10 + 3
//   budget     §111 the ink budget: Σ dye·(rad/RADIUS)² per second (ema INK_TAU 12 s) above INK_BUDGET scales dyeDiss (the void's .05 too); the drop not counted;
//              a 5 s burst reaches a third of its rate (a build passes), 60 s of nothing decays it
//   drop       dropLiveEvt → dyeDiss DROP_DISS (12) for one beat (60/bpm s on dt), then back to the void mapping; the impulse radius ×4
//   mapdrop    §107: a mapDropEvt frame arms the same clear (file mode's bar line); a dropEvt-only frame does NOT (CONTRACTS §1.18: not a clear)
//   floor      §108: a pad-only frame (mid up, no events) → one dye-only splat at the key's fifths sector, y .5, radius ×2, dx = dy = 0;
//              the knee (mid .1 → nothing); silence → nothing; 120 pad frames → never a velocity; the §107 clear holds it under 5 %
//   chord      §108: the v1 `snare` level rising > CHORD_RISE with no snareEvt → two shears at a third of the snare's force, sized by the
//              rise, then the refractory (a further rise inside CHORD_REF → nothing; after it → again); a held level → nothing; a
//              snareEvt frame → the lane's two shears only, and its own rise on the frame after → nothing; a sub-threshold rise → nothing
//   params     curl 10 + 40·tension; velDiss 0.2 → 3.0 as lpSweep closes (+2·hush); dyeDiss 1 → .05 as buildLive rises; tongueAmbig only while tongueOn 1
//   gain       presence 0 → no splat has any velocity or dye; hush / calm lower it
//   colour     the key hue through keycolour's anchor, linear (every component in [0,1]); more saturated with tonicConf; §111: the key
//              pinned at KEY_TRUST .1 (keyConf .15 = .8), held through no trust, the harmony's eased centre before any trust (two
//              harmAngles → two hues; a fifth flipping every half second moves it < .02/frame), LOOK's mood ignored, the evidence
//              tally (5 s of another key: no re-pin; 20–40 s: re-pin)
//   determ     two fresh states on the same REAL trace → byte-identical output (JSON)
//   breath     the beat's body force: −.35·cos⁴(π·beatPhase) × gain, 0 at phase .5
//   music      per library track (both map modes): the grammar injects on ≥ 95 % of the seconds WITH music (presence median > .3);
//              a frame with presence 0 moves nothing and inks nothing; the drop clear (dyeDiss DROP_DISS) is armed ON the frame of
//              every mapDropEvt / dropLiveEvt and held for one beat; on SeeYouDrop (the tuning track) mapDropEvt lands within one
//              frame of each truth drop (57.606 / 105.596, tools/truth/SeeYouDrop.json); the pad take: nothing moves or inks while
//              the room is silent (presence 0, the first 2.5 s), every second from 3 s on injects (§108's 22 / 22); the numbers per track print;
//              §111 the key: IBelongHere D minor from < 70 s to the end (≤ 2 pins), one hue over the intro and one over the grooves; WhoLikesToParty
//              D major from < 10 s, never re-pinned; SeeYouDrop C# minor from < 15 s (≤ 2 pins); Comptine never trusted (the harmony's centre)
import { plan, mkState, FLUID_FEATS, K } from '../assets/core/fluid/inject.js';
import { FEATS } from '../assets/engine/feats.js';
import { MS } from '../assets/engine/state.js';
import { sectorPc } from '../assets/math/keycolour.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WIN = JSON.parse(fs.readFileSync(path.join(HERE, 'truth/windows.json'), 'utf8')).tracks;
// a real trace (tools/traces.sh): {cols, t, f}; missing → the one-line fix, and the test FAILS (the claims below are on music)
const traces = {};
function trace(name) {
  if (traces[name]) return traces[name];
  const f = path.join(HERE, 'truth/traces', name + '.json');
  if (!fs.existsSync(f)) { console.log('FAIL no trace ' + name + ' — record it: PORT=88xx tools/traces.sh ' + name); fail++; return null; }
  return (traces[name] = JSON.parse(fs.readFileSync(f, 'utf8')));
}
// replay plan() over a trace: per-frame {t, S, P}; the hats' x is seeded here (seed is an object, not traced) as fluid-replay.js does
function replay(J, st = mkState()) {
  const C = J.cols, T = J.t, out = [];
  let prev = null;
  for (let i = 0; i < J.f.length; i++) {
    const S = {};
    for (const k in C) S[k] = C[k][i];
    S.seed = { a: 0.37 }; S.subNote = S.subNote == null ? -1 : S.subNote;
    const dt = prev === null ? 1 / 60 : Math.max(1e-3, Math.min(0.1, T[i] - prev));
    prev = T[i];
    out.push({ t: T[i], S, P: plan(S, dt, st), pin: st.pin ? (st.pin.k % 12) * 2 + st.pin.m : -1, conf: st.anchor.OUT.conf });
  }
  return out;
}
const med = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[s.length >> 1] : NaN; };

let pass = 0, fail = 0;
let gate = true;   // false on a track that is not a gate (windows.json `gate`: Malicious, pending the user's validation of the map's sub ruler): its claims print as notes, never FAIL
const ok = (c, m) => { if (!gate) { console.log((c ? 'note ' : 'NOTE ') + m + (c ? '' : '  [would FAIL; not a gate]')); return; } if (c) { pass++; console.log('ok   ' + m); } else { fail++; console.log('FAIL ' + m); } };
const near = (a, b, tol, m) => ok(Math.abs(a - b) <= tol, `${m}: ${a} vs ${b} (tol ${tol})`);
const DT = 1 / 60;

// A full MS with the defaults (every field present), overridden per case. loud / present / a key, so the gain is not 0.
const base = (o = {}) => Object.assign({}, MS, { presence: 1, loudRel: 1, hush: 0, calm: 0, key: 0, mode: 0, keyConf: 0.8, tonicConf: 0.7, valence: 0.5, harmAngle: 0,
  modeShade: 0, tension: 0.3, lpSweep: 0.2, buildLive: 0, tongueAmbig: 0, tongueOn: 1, bpm: 120, beatPhase: 0.5, beatCount: 10, seed: { hue: 0.6, th: 0, a: 0.3, scene: -1 },
  subGate: 0, subNote: -1, subGlide: 0, subHz: 0, bassReg: 0, kickEvt: false, kickAmp: 0, kickAge: 99, snareEvt: false, snareAmp: 0, hat2: 0, denH: 0, dropLiveEvt: false }, o);
const run = (S, st = mkState()) => plan(S, DT, st);

// feats
{
  const undecl = FLUID_FEATS.filter((k) => !(k in FEATS));
  ok(undecl.length === 0, 'feats: every FLUID_FEATS key in FEATS' + (undecl.length ? ' — missing ' + undecl.join(',') : ' (' + FLUID_FEATS.length + ')'));
  const banned = FLUID_FEATS.filter((k) => /^pred|Vel$|^dropEvt$/.test(k));
  ok(banned.length === 0, 'feats: no pred* / *Vel / dropEvt read' + (banned.length ? ' — ' + banned.join(',') : ''));
}

// proxy: every frame of SeeYouDrop's real trace through a Proxy that throws on any undeclared read (§109: on music, not a sweep)
{
  const allowed = new Set(FLUID_FEATS);
  let reads = 0, thrown = null, n = 0;
  const guard = (S) => new Proxy(S, { get(t, k) { if (typeof k === 'string' && !allowed.has(k)) throw new Error('undeclared read ' + k); reads++; return t[k]; } });
  const J = trace('SeeYouDrop-map1');
  if (J) {
    const st = mkState(), C = J.cols;
    try {
      for (let i = 0; i < J.f.length; i++) {
        const S = {}; for (const k in C) S[k] = C[k][i]; S.seed = { a: 0.37 }; S.subNote = S.subNote == null ? -1 : S.subNote;
        run(guard(S), st); n++;
      }
    } catch (e) { thrown = e.message; }
    ok(thrown === null && n === J.f.length, 'proxy: SeeYouDrop ' + n + ' real frames, no read outside FLUID_FEATS' + (thrown ? ' — ' + thrown : ' (' + reads + ' reads)'));
  }
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

// kick (§111: the size is the hit's RANK in the lane's own recent range — AMP0 + (1 − AMP0)·rank, then the sqrt law)
{
  const a = run(base({ kickEvt: true, kickAmp: 0.25, kickAge: 0 })), b = run(base({ kickEvt: true, kickAmp: 1, kickAge: 0 }));
  ok(a.splats.length === 1 && b.splats.length === 1, 'kick: kickEvt → one impulse');
  near(a.splats[0].dy, K.KICK_V * Math.sqrt(K.AMP0), 1e-9, 'kick: a hit under the lane\'s prior p10 (.25 < .3) → dy = KICK_V·√AMP0 (the floor of the law)');
  near(b.splats[0].dy, K.KICK_V, 1e-9, 'kick: a hit at the prior\'s p90 or above → dy = KICK_V');
  near(b.splats[0].dy / a.splats[0].dy, 1 / Math.sqrt(K.AMP0), 1e-9, 'kick: the law\'s room is 1/√AMP0 (' + (1 / Math.sqrt(K.AMP0)).toFixed(2) + '×, was √(1/.31) = 1.8× under the lane\'s floor)');
  near(a.splats[0].y, 0.06, 1e-9, 'kick: from the floor');
  near(a.splats[0].rad, K.RADIUS * 2, 1e-12, 'kick: radius ×2');
  ok(a.splats[0].k === 'kick', 'kick: tagged k = kick (§111: every splat carries its kind)');
  const st = mkState();
  run(base({ kickEvt: true, kickAmp: 1, kickAge: 0 }), st);
  const tail = run(base({ kickEvt: false, kickAmp: 1, kickAge: 1 / 60 }), st);
  ok(tail.splats.length === 1 && Math.abs(tail.splats[0].dy - 0.4 * K.KICK_V) < 1e-9, 'kick: the frame after keeps 40 % of the same ranked size (' + (tail.splats.length ? tail.splats[0].dy.toFixed(3) : 'none') + ')');
  const late = run(base({ kickEvt: false, kickAmp: 1, kickAge: 3 / 60 }), st);
  ok(late.splats.length === 0, 'kick: nothing 3 frames after');
  ok(run(base({ kickAge: 99 })).splats.length === 0, 'kick: nothing before any kick (age 99)');
  // the rank is the TRACK's own: a lane whose hits all sit in .5–.6 (no room under the old √amp law) spreads them over the whole law
  const st2 = mkState(), dys = [];
  for (let i = 0; i < 20; i++) dys.push(run(base({ kickEvt: true, kickAmp: 0.5 + 0.1 * ((i * 7) % 11) / 10, kickAge: 0 }), st2).splats[0].dy);
  const lo = run(base({ kickEvt: true, kickAmp: 0.5, kickAge: 0 }), st2).splats[0].dy, hi = run(base({ kickEvt: true, kickAmp: 0.6, kickAge: 0 }), st2).splats[0].dy;
  near(lo, K.KICK_V * Math.sqrt(K.AMP0), 1e-9, 'kick: after 20 hits in .5–.6, a .5 hit is the lane\'s p10 → the floor of the law (' + lo.toFixed(3) + ')');
  near(hi, K.KICK_V, 1e-9, 'kick: and a .6 hit its p90 → the full law (' + hi.toFixed(3) + ') — the track\'s own range, not the lane\'s');
  ok(st2.rkK.length === 22 && st2.rkK.length <= K.RANK_N, 'kick: the rank buffer holds the last ' + K.RANK_N + ' hits (' + st2.rkK.length + ' so far)');
}

// snare
{
  const r = run(base({ snareEvt: true, snareAmp: 0.5 }));
  ok(r.splats.length === 2, 'snare: two shears (' + r.splats.length + ')');
  if (r.splats.length === 2) {
    const [l, rr] = r.splats;
    ok(l.x === 0.3 && rr.x === 0.7 && l.y === 0.5 && rr.y === 0.5, 'snare: at (.3, .5) and (.7, .5)');
    near(l.dx, -rr.dx, 1e-12, 'snare: equal and opposite');
    near(l.dx, K.SNARE_V * (K.AMP0 + (1 - K.AMP0) * (0.5 - 0.3) / 0.65), 1e-9, 'snare: dx = SNARE_V·(AMP0 + (1 − AMP0)·rank) — rank on the prior .3 / .95 until the lane has 8 hits (§111)');
    ok(l.k === 'snare' && rr.k === 'snare', 'snare: tagged k = snare');
  }
  ok(run(base({ snareEvt: true, snareAmp: 1 })).splats[0].dx === K.SNARE_V && Math.abs(run(base({ snareEvt: true, snareAmp: 0.1 })).splats[0].dx - K.SNARE_V * K.AMP0) < 1e-9, 'snare: the biggest hit the full SNARE_V, one under the p10 the floor AMP0');
}

// hats (§111: a token bucket — 3 tokens, HAT_RATE per second back)
{
  const r3 = run(base({ hat2: 0.8, denH: 2.6 })), r1 = run(base({ hat2: 0.8, denH: 1.2 })), r0 = run(base({ hat2: 0.2, denH: 3 })), r5 = run(base({ hat2: 0.8, denH: 7 }));
  ok(r3.splats.length === 3 && r1.splats.length === 1 && r0.splats.length === 0 && r5.splats.length === 3, `hats: min(3, round(denH)) while hat2 > .3 on a full bucket (${r3.splats.length} ${r1.splats.length} ${r0.splats.length} ${r5.splats.length})`);
  ok(r3.splats.every((s) => s.y === 0.9 && s.dy < 0 && s.x >= 0 && s.x < 1 && s.k === 'hat'), 'hats: from the surface, falling, x in [0, 1), tagged k = hat');
  const again = run(base({ hat2: 0.8, denH: 2.6 }));
  ok(again.splats.map((s) => s.x).join() === r3.splats.map((s) => s.x).join(), 'hats: the same beat → the same x (seeded)');
  const next = run(base({ hat2: 0.8, denH: 2.6, beatCount: 11 }));
  ok(next.splats.map((s) => s.x).join() !== r3.splats.map((s) => s.x).join(), 'hats: the next beat → another x');
  near(r3.splats[0].rad, K.RADIUS * 0.5, 1e-12, 'hats: radius ×.5');
  const st = mkState(), per = [];
  for (let i = 0; i < 12; i++) per.push(run(base({ hat2: 0.8, denH: 3 }), st).splats.length);
  ok(per[0] === 3 && per.slice(1, 8).every((n) => n === 0) && per[8] === 1 && per.reduce((a, b) => a + b, 0) === 4, 'hats: a 12-frame burst at denH 3 → 3 on the first frame, nothing until the bucket refills one (frame 9), 4 in all [' + per.join(' ') + ']');
  const st2 = mkState(); let n = 0;
  for (let i = 0; i < 600; i++) n += run(base({ hat2: 0.8, denH: 3 }), st2).splats.length;
  ok(n >= 10 * K.HAT_RATE && n <= 10 * K.HAT_RATE + 3, 'hats: 10 s of hats at denH 3 → ' + n + ' droplets (≤ HAT_RATE·10 + 3 = ' + (10 * K.HAT_RATE + 3) + '; was 1800)');
  const st3 = mkState();
  run(base({ hat2: 0.8, denH: 3 }), st3); for (let i = 0; i < 30; i++) run(base({ hat2: 0 }), st3);
  ok(run(base({ hat2: 0.8, denH: 3 }), st3).splats.length === 3, 'hats: half a second of quiet refills the bucket — the next hit\'s first three again');
}

// budget (§111: the injected ink per second, area-weighted, above INK_BUDGET scales dyeDiss; the drop is not counted)
{
  const st = mkState();
  ok(run(base(), st).params.dyeDiss === 1 && run(base(), st).ink === 0, 'budget: nothing injected → the grammar\'s dyeDiss, ink rate 0');
  let p; for (let i = 0; i < 60 * 60; i++) p = run(base({ kickEvt: true, kickAmp: 1, kickAge: 0, snareEvt: true, snareAmp: 1 }), st);
  const inkFrame = p.splats.reduce((a, s) => a + (s.r + s.g + s.b) * (s.rad / K.RADIUS) ** 2, 0);
  ok(p.ink > 0.9 * inkFrame * 60 && p.params.dyeDiss > 2 && Math.abs(p.params.dyeDiss - Math.max(1, p.ink / K.INK_BUDGET)) < 1e-9, `budget: a kick + a snare every frame for 60 s → ink ${p.ink.toFixed(0)}/s (frame ${inkFrame.toFixed(2)} × 60), dyeDiss = ink / INK_BUDGET = ${p.params.dyeDiss.toFixed(2)}`);
  const v = run(base({ kickEvt: true, kickAmp: 1, kickAge: 0, snareEvt: true, snareAmp: 1, buildLive: 1 }), st);
  ok(v.params.dyeDiss > 0.05 && Math.abs(v.params.dyeDiss - 0.05 * Math.max(1, v.ink / K.INK_BUDGET)) < 1e-9, 'budget: in the void it scales the void\'s .05 (' + v.params.dyeDiss.toFixed(3) + ') — the ink still accumulates, slower');
  for (let i = 0; i < 60 * 60; i++) p = run(base(), st);
  ok(p.params.dyeDiss === 1 && p.ink < 0.1 * K.INK_BUDGET, 'budget: 60 s of nothing → the rate decays (ema INK_TAU ' + K.INK_TAU + ' s) and dyeDiss is the grammar\'s again (ink ' + p.ink.toFixed(2) + ')');
  const st5 = mkState(); let p5;
  for (let i = 0; i < 5 * 60; i++) p5 = run(base({ kickEvt: true, kickAmp: 1, kickAge: 0, snareEvt: true, snareAmp: 1 }), st5);
  ok(p5.ink < 0.4 * inkFrame * 60 && p5.ink > 0.3 * inkFrame * 60, 'budget: a 5 s burst reaches only ' + (100 * p5.ink / (inkFrame * 60)).toFixed(0) + ' % of its rate (INK_TAU ' + K.INK_TAU + ' s: a build\'s roll passes, a steady boil is governed)');
  const d = run(base({ dropLiveEvt: true }), mkState());
  ok(d.ink < 1e-9, 'budget: the drop\'s impulse is not counted in the rate (' + d.ink + ')');
  near(K.INK_BUDGET, 14, 1e-9, 'budget: INK_BUDGET 14 (SeeYouDrop\'s groove p50 12 area-weighted ink/s; CyborgNinja 31 → ×2.2 — tools/fluid-tracks.js)');
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
  ok(ev.splats.length === 2 && ev.chord === 0 && Math.abs(ev.splats[0].dx - K.SNARE_V * (K.AMP0 + (1 - K.AMP0) * (0.5 - 0.3) / 0.65)) < 1e-9, 'chord: a snareEvt frame → the lane\'s two shears only, at the ranked size (dx ' + ev.splats[0].dx.toFixed(3) + ')');
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

// colour (§111: the key pinned at KEY_TRUST .1 and held by its evidence, the harmony's centre before any trust — never LOOK's mood)
{
  const c = run(base()).colour;
  ok(c.length === 3 && c.every((x) => x >= 0 && x <= 1), 'colour: linear rgb in [0, 1] (' + c.map((x) => x.toFixed(3)).join(' ') + ')');
  const sat = (col) => Math.max(...col) - Math.min(...col);
  const lo = run(base({ tonicConf: 0 })).colour, hi = run(base({ tonicConf: 1 })).colour;
  ok(sat(hi) > sat(lo), 'colour: more saturated with tonicConf (' + sat(lo).toFixed(3) + ' → ' + sat(hi).toFixed(3) + ')');
  const settle = (o, st, n = 300) => { let col; for (let i = 0; i < n; i++) col = run(base(o), st).colour; return col; };
  const same = (a, b, tol = 1e-6) => a.every((x, i) => Math.abs(x - b[i]) <= tol);
  const g = settle({ key: 7 }, mkState()), c0 = settle({ key: 0 }, mkState());
  ok(g.join() !== c0.join(), 'colour: another key, another hue');
  const trusted = settle({ key: 7, mode: 1, keyConf: 0.8 }, mkState(), 600), low = settle({ key: 7, mode: 1, keyConf: 0.15 }, mkState(), 600);
  ok(same(trusted, low, 1e-3), 'colour: keyConf .15 (under keycolour\'s KEYC1 .3) takes the key within 10 s — the pool pins at KEY_TRUST ' + K.KEY_TRUST + ' once the evidence is in');
  const st = mkState(); settle({ key: 7, mode: 1, keyConf: 0.5 }, st);
  const held = settle({ key: 7, mode: 1, keyConf: 0, harmAngle: Math.PI, valence: 0.9, modeShade: 0 }, st);
  ok(same(held, settle({ key: 7, mode: 1, keyConf: 0.5, valence: 0.9 }, mkState()), 1e-3), 'colour: the key holds through 5 s of no trust while the harmony and the mood move (before: it slid to LOOK.mood.hue)');
  const fa = settle({ keyConf: 0, harmAngle: 0 }, mkState()), fb = settle({ keyConf: 0, harmAngle: Math.PI }, mkState());
  ok(fa.join() !== fb.join(), 'colour: no trusted key yet → the harmony\'s centre colours the pool: harmAngle 0 and π give two hues');
  const stA = mkState(), stB = mkState();
  ok(JSON.stringify(plan(base({ keyConf: 0 }), DT, stA, 0.1)) === JSON.stringify(plan(base({ keyConf: 0 }), DT, stB, 0.9)), 'colour: the old fourth argument (LOOK.mood.hue) is ignored');
  const stC = mkState(); let drift = 0, prev = null;
  for (let i = 0; i < 1200; i++) { const col = run(base({ keyConf: 0, harmAngle: (i % 4) * Math.PI / 2 * 0 + (i % 60 < 30 ? 0 : Math.PI / 6) }), stC).colour; if (prev) drift = Math.max(drift, Math.abs(col[0] - prev[0]) + Math.abs(col[1] - prev[1]) + Math.abs(col[2] - prev[2])); prev = col; }
  ok(drift < 0.02, 'colour: a harmony flipping a fifth every half second moves the fallback hue by < .02 per frame (the centre is an ema of HARM_TAU ' + K.HARM_TAU + ' s; max |Δrgb| ' + drift.toFixed(4) + ')');
  const st2 = mkState(); settle({ key: 7, mode: 0, keyConf: 0.5 }, st2, 600);
  settle({ key: 2, mode: 0, keyConf: 0.5 }, st2, 300);
  ok(st2.pin.k === 7, 'colour: 5 s of another key at the same trust does not re-pin (its evidence must reach KEY_MARGIN ' + K.KEY_MARGIN + ' × the pinned key\'s, ema KEY_TAU ' + K.KEY_TAU + ' s)');
  let n = 300; while (st2.pin.k !== 2 && n < 60 * 90) { run(base({ key: 2, mode: 0, keyConf: 0.5 }), st2); n++; }
  ok(st2.pin.k === 2 && n > 60 * 8 && n < 60 * 40, 'colour: it re-pins after ' + (n / 60).toFixed(1) + ' s of the new key at equal trust (a modulation shows in 10–40 s, sooner when the old key\'s evidence is young)');
  const st3 = mkState(); let m = 0; while (!st3.pin && m < 600) { run(base({ key: 5, mode: 0, keyConf: 0.1 }), st3); m++; }
  const tEv = -K.KEY_TAU * Math.log(1 - K.KEY_EV0 / (0.1 * K.KEY_TAU));   // the ema's rise to KEY_EV0 at trust .1
  ok(st3.pin && st3.pin.k === 5 && Math.abs(m / 60 - tEv) < 0.2, 'colour: the first pin needs KEY_EV0 ' + K.KEY_EV0 + ' of evidence — ' + (m / 60).toFixed(1) + ' s at trust .1 (' + tEv.toFixed(1) + ' expected; a cold start\'s first trusted guess is often wrong)');
}

// determ: two fresh states over the same REAL trace → byte-identical plans (§109)
{
  const J = trace('SeeYouDrop-map0');
  if (J) {
    const a = JSON.stringify(replay(J, mkState()).map((r) => r.P)), b = JSON.stringify(replay(J, mkState()).map((r) => r.P));
    ok(a === b, 'determ: two fresh states on SeeYouDrop\'s ' + J.f.length + ' real frames → identical output (' + a.length + ' chars)');
  }
}

// breath
{
  near(run(base({ beatPhase: 0 })).body, -K.BODY, 1e-9, 'breath: −BODY at the beat');
  near(run(base({ beatPhase: 0.5 })).body, 0, 1e-9, 'breath: 0 at phase .5');
  near(run(base({ beatPhase: 0, hush: 1 })).body, -K.BODY * 0.2, 1e-9, 'breath: rides the gain');
}

// music (§109): the grammar on every library track, both map modes, and the pad take — what the user hears is what is asserted
{
  const names = [];
  for (const t in WIN) { if (WIN[t].map0only) names.push(t + '-map0'); else names.push(t + '-map1', t + '-map0'); }
  const beat = (bpm) => Math.round(60 / Math.max(60, bpm) * 60);   // the clear's length in frames at that tempo
  for (const name of names) {
    const J = trace(name); if (!J) continue;
    gate = WIN[name.replace(/-map[01]$/, '')].gate !== false;
    const rows = replay(J), by = new Map();
    for (const r of rows) { const s = Math.floor(r.t); if (!by.has(s)) by.set(s, []); by.get(s).push(r); }
    const secs = [...by.entries()].filter(([s, rs]) => rs.length >= 30);   // whole seconds only
    const music = secs.filter(([s, rs]) => med(rs.map((r) => r.S.presence)) > 0.3);
    const inj = music.filter(([s, rs]) => rs.some((r) => r.P.splats.length > 0));
    const pct = music.length ? 100 * inj.length / music.length : 0;
    const silentFrames = rows.filter((r) => r.S.presence === 0);
    const moved = silentFrames.filter((r) => r.P.splats.some((p) => Math.abs(p.dx) + Math.abs(p.dy) + p.r + p.g + p.b > 0)).length;
    const drops = rows.filter((r) => r.S.mapDropEvt || r.S.dropLiveEvt);
    let armed = 0, held = 0;
    for (const r of drops) {
      const i = rows.indexOf(r); if (r.P.params.dyeDiss === K.DROP_DISS) armed++;
      const n = beat(r.S.bpm); let h = 0; for (let j = i; j < Math.min(rows.length, i + n - 1); j++) if (rows[j].P.params.dyeDiss === K.DROP_DISS) h++;
      if (h >= n - 2) held++;
    }
    const mapDrops = rows.filter((r) => r.S.mapDropEvt).map((r) => +r.t.toFixed(3)), liveDrops = rows.filter((r) => r.S.dropLiveEvt).map((r) => +r.t.toFixed(3));
    console.log(`     ${name.padEnd(22)} ${rows.length} frames · music s ${music.length} / ${secs.length} · inject ${inj.length} (${pct.toFixed(1)} %) · silent frames ${silentFrames.length} moved ${moved} · drops armed ${armed}/${drops.length} held ${held} · mapDropEvt ${JSON.stringify(mapDrops)} dropLiveEvt ${JSON.stringify(liveDrops)}`);
    ok(pct >= 95, `music: ${name} injects on ≥ 95 % of the seconds with music (${inj.length} / ${music.length} = ${pct.toFixed(1)} %)`);
    ok(moved === 0, `music: ${name} — a frame with presence 0 moves nothing and inks nothing (${moved} of ${silentFrames.length} silent frames did)`);
    ok(armed === drops.length && held === drops.length, `music: ${name} — the clear is armed ON every mapDropEvt / dropLiveEvt frame and held a beat (${armed} / ${held} of ${drops.length})`);
    if (name === 'SeeYouDrop-map1') {
      const truth = WIN.SeeYouDrop.drops, near = truth.map((d) => mapDrops.some((m) => Math.abs(m - d) <= 1 / 60 + 1e-6));
      ok(near.every(Boolean) && mapDrops.length === truth.length, `music: SeeYouDrop's mapDropEvt lands within one frame of each truth drop ${JSON.stringify(truth)} → ${JSON.stringify(mapDrops)}`);
    }
    // §111 the colour on music: the pinned key per track (the hue the pool is coloured by), the hue's walk at the survey's windows
    const NOTE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'], kname = (p) => (p < 0 ? '—' : NOTE[p >> 1] + (p & 1 ? 'm' : ''));
    const firstPin = rows.find((r) => r.pin >= 0), pins = [...new Set(rows.filter((r) => r.pin >= 0).map((r) => r.pin))];
    const hueOf = (col) => { const [r, g, b] = col, M = Math.max(r, g, b), m = Math.min(r, g, b), d = M - m; if (d < 1e-9) return 0; const h = M === r ? ((g - b) / d) % 6 : M === g ? (b - r) / d + 2 : (r - g) / d + 4; return ((h / 6) + 1) % 1; };
    const hueAt = (t) => { const r = rows.find((x) => x.t >= t); return r ? hueOf(r.P.colour) : NaN; };
    const hdist = (a, b) => { const d = Math.abs(a - b) % 1; return Math.min(d, 1 - d); };
    console.log(`     ${name.padEnd(22)} key: first pin ${firstPin ? firstPin.t.toFixed(1) + ' s ' + kname(firstPin.pin) : 'never'} · pins ${pins.map(kname).join(' ')} · key-coloured frames ${(100 * rows.filter((r) => r.conf >= 0.999).length / rows.length).toFixed(0)} %`);
    const lastPin = pins.length ? rows.find((r) => r.pin === pins[pins.length - 1]) : null;
    if (name === 'IBelongHere-map1' || name === 'IBelongHere-map0') {
      ok(firstPin && pins.length <= 2 && kname(pins[pins.length - 1]) === 'Dm' && lastPin.t < 70, `music: ${name} — the pool's key is D minor from ${lastPin ? lastPin.t.toFixed(1) : '—'} s to the end of the trace (pins ${pins.map(kname).join(' → ')}; before: keyConf ≥ .3 on 2 % of frames, the mood hue walked seven hues)`);
      const after = [60, 100].map(hueAt), before = [2, 10, 16].map(hueAt);
      ok(hdist(after[0], after[1]) < 0.1 && hdist(before[0], before[1]) < 0.1 && hdist(before[1], before[2]) < 0.1, `music: ${name} — one hue over the vocal intro (2 / 10 / 16 s: ${before.map((h) => h.toFixed(2)).join(' ')} turns, the harmony's centre) and one over the grooves (60 / 100 s: ${after.map((h) => h.toFixed(2)).join(' ')}, the key's)`);
    }
    if (name === 'WhoLikesToParty-map1') ok(pins.length === 1 && kname(pins[0]) === 'D' && firstPin.t < 10, `music: ${name} — D major is the pool's key from ${firstPin.t.toFixed(1)} s to 110 s, never re-pinned (the KK's D ↔ Bm flicker, 10–23 s stretches, does not reach the pin here; pins ${pins.map(kname).join(' → ')})`);
    if (name === 'SeeYouDrop-map1') ok(pins.length <= 2 && kname(pins[pins.length - 1]) === 'C#m' && lastPin.t < 15, `music: ${name} — C# minor from ${lastPin.t.toFixed(1)} s to the end (pins ${pins.map(kname).join(' → ')}: the tonic's mode settles in the first bars; the reference's colour as before)`);
    if (name === 'Comptine-map1') ok(!firstPin, `music: ${name} — the piano never reaches the trust (keyConf 0 throughout): the harmony's centre colours it, never a mood`);
    if (name === 'rec-map0') {
      const from3 = [...by.entries()].filter(([s]) => s >= 3 && s <= 24), inj3 = from3.filter(([s, rs]) => rs.some((r) => r.P.splats.length > 0));   // 24 is the take's last, partial second (§108 counted it)
      ok(inj3.length === from3.length && from3.length === 22, `music: the pad take injects on every second from 3 s (${inj3.length} / ${from3.length}; §108's 22 / 22)`);
      const silentT = silentFrames.length ? silentFrames[silentFrames.length - 1].t : 0;
      const forced = rows.filter((r) => r.t <= silentT && r.P.splats.some((p) => Math.abs(p.dx) + Math.abs(p.dy) + p.r + p.g + p.b > 0)).length;
      ok(silentFrames.length >= 100 && forced === 0, `music: the pad take's silent room (presence 0 to ${silentT.toFixed(2)} s, ${silentFrames.length} frames) moves and inks nothing (${forced} frames did)`);
    }
  }
}

gate = true;
console.log(`test_fluid: ${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
