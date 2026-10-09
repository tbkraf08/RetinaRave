// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// Solver after Pavel Dobryakov, WebGL-Fluid-Simulation (MIT, 2017) — https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
// Replay the fluid grammar's pure plan() (core/fluid/inject.js) over a filetrace JSON: what the pool was told, frame by frame,
// with no GL — the ruler FLUID-DIAG-2026-10-09 §4 reproduced the user's take with (DECISIONS §108, HARNESS "## Fluid").
//   node tools/fluid-replay.js <trace.json> [t0=0] [t1=1e9] [sec|events|frame]
//   FLUIDK='{"FLOOR_DYE":0,"CHORD_V":0}' node tools/fluid-replay.js …   — K overrides for an A/B of one knob (the grammar before §108)
// The trace must carry FLUID_FEATS (filetrace.js with the field list, or '*'); `seed` is an object in MS and is not traced, so
// the hats' x is seeded here (0.37). 'sec' = one line per second (the channels' splat counts, the injected Σ|dv|, the dye);
// 'events' = every frame that injects; 'frame' = every frame. Splats are classified by the grammar's emit order.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { plan, mkState, FLUID_FEATS, K } from '../assets/core/fluid/inject.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const [file, t0s = '0', t1s = '1e9', mode = 'sec'] = process.argv.slice(2);
if (!file) { console.error('usage: node tools/fluid-replay.js <trace.json> [t0] [t1] [sec|events|frame]'); process.exit(2); }
if (process.env.FLUIDK) Object.assign(K, JSON.parse(process.env.FLUIDK));
const J = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
const C = J.cols, N = J.f.length, T = J.t;
const missing = FLUID_FEATS.filter((k) => !(k in C) && k !== 'seed');
console.log(`# ${path.relative(HERE + '/..', path.resolve(file))}: ${N} frames, t ${(+T[0]).toFixed(3)} → ${(+T[N - 1]).toFixed(3)}, mode ${J.mode}; missing cols: ${missing.join(',') || 'none'}${process.env.FLUIDK ? '; K ' + process.env.FLUIDK : ''}`);
const st = mkState();
const rows = [];
let prev = null;
const ORDER = ['sub', 'kick', 'snare', 'chord', 'hat', 'floor', 'drop']; // the grammar's emit order (inject.js)
for (let i = 0; i < N; i++) {
  const S = {};
  for (const k in C) S[k] = C[k][i];
  S.seed = { a: 0.37 };
  for (const k of missing) S[k] = 0;
  S.subNote = S.subNote == null ? -1 : S.subNote;
  const dt = prev === null ? 1 / 60 : Math.max(1e-3, Math.min(0.1, T[i] - prev));
  prev = T[i];
  const P = plan(S, dt, st, 0.6);
  const kAge = S.kickAge < 99 ? Math.max(0, S.kickAge) : 99;
  const want = { sub: S.subGate > 0 ? 1 : 0, kick: S.kickEvt || kAge < 2 / 60 ? 1 : 0, snare: S.snareEvt ? 2 : 0, chord: P.chord > 0 ? 2 : 0,
    hat: S.hat2 > 0.3 ? Math.min(3, Math.round(S.denH)) : 0, floor: P.floor > 0 ? 1 : 0, drop: S.dropLiveEvt || S.mapDropEvt ? 1 : 0 };
  const kinds = {}; let j = 0;
  for (const k of ORDER) { kinds[k] = want[k] ? P.splats[j] : null; j += want[k]; }
  if (j !== P.splats.length) kinds.unclassified = P.splats.length - j;
  rows.push({ t: +T[i], S, P, kinds, want, dt });
}
const t0 = +t0s, t1 = +t1s;
const sel = rows.filter((r) => r.t >= t0 && r.t <= t1);
const f = (v, d = 2) => (v == null || !isFinite(+v) ? 'null' : (+v).toFixed(d));
const dyeOf = (s) => (s ? s.r + s.g + s.b : 0);
if (mode === 'frame' || mode === 'events') {
  for (const r of sel) {
    if (mode === 'events' && !(r.P.splats.length || r.S.dropEvt || r.S.kickEvt || r.S.snareEvt)) continue;
    const S = r.S, k = r.kinds, P = r.P;
    console.log(`${f(r.t, 3)} g=${f(P.gain)} n=${P.splats.length} | sub${k.sub ? ' x=' + f(k.sub.x) + ' dy=' + f(k.sub.dy, 3) : ' -'} | kick${k.kick ? ' dy=' + f(k.kick.dy) + ' amp=' + f(S.kickAmp) : ' -'} | snare${k.snare ? ' dx=' + f(k.snare.dx) + ' amp=' + f(S.snareAmp) : ' -'} | chord${k.chord ? ' dx=' + f(k.chord.dx, 3) + ' Δ=' + f(P.chord) : ' -'} | hats=${r.want.hat} | floor${k.floor ? ' dye=' + f(dyeOf(k.floor), 4) + ' mid=' + f(S.mid) : ' -'} | body=${f(P.body, 3)} | dyeDiss=${f(P.params.dyeDiss)} curl=${f(P.params.curl, 0)} | tongueOn=${S.tongueOn} dropLive=${S.dropLiveEvt} mapDrop=${S.mapDropEvt} dropEvt=${S.dropEvt}${k.unclassified ? ' UNCLASSIFIED ' + k.unclassified : ''}`);
  }
} else {
  const by = new Map();
  for (const r of sel) { const s = Math.floor(r.t); if (!by.has(s)) by.set(s, []); by.get(s).push(r); }
  console.log('sec | n | g | pres | loudRel | mid | subGate% | kicks (amp) | snares (amp) | chords (Δsnare) | hats | floor frames · dye/s | drops L/M/E | splats | Σ|dv| uv/s | Σdye | dyeDiss | curl');
  let tot = { sec: 0, inj: 0, floorSec: 0, chordSec: 0 };
  for (const [s, rs] of [...by.entries()].sort((a, b) => a[0] - b[0])) {
    const m = (fn) => rs.reduce((a, r) => a + fn(r), 0) / rs.length;
    const kicks = rs.filter((r) => r.S.kickEvt).map((r) => f(r.S.kickAmp)), snares = rs.filter((r) => r.S.snareEvt).map((r) => f(r.S.snareAmp));
    const chords = rs.filter((r) => r.P.chord > 0).map((r) => f(r.P.chord));
    const dv = rs.reduce((a, r) => a + r.P.splats.reduce((b, p) => b + Math.hypot(p.dx, p.dy), 0), 0);
    const dye = rs.reduce((a, r) => a + r.P.splats.reduce((b, p) => b + dyeOf(p), 0), 0);
    const floorN = rs.filter((r) => r.kinds.floor).length, floorDye = rs.reduce((a, r) => a + dyeOf(r.kinds.floor), 0);
    const nsp = rs.reduce((a, r) => a + r.P.splats.length, 0), hats = rs.reduce((a, r) => a + r.want.hat, 0);
    const drops = [rs.filter((r) => r.S.dropLiveEvt).length, rs.filter((r) => r.S.mapDropEvt).length, rs.filter((r) => r.S.dropEvt).length];
    tot.sec++; if (nsp) tot.inj++; if (floorN) tot.floorSec++; if (chords.length) tot.chordSec++;
    console.log(`${s} | ${rs.length} | ${f(m((r) => r.P.gain))} | ${f(m((r) => r.S.presence))} | ${f(m((r) => r.S.loudRel))} | ${f(m((r) => r.S.mid || 0))} | ${f(100 * m((r) => (r.S.subGate > 0 ? 1 : 0)), 0)}% | ${kicks.length} (${kicks.join(' ')}) | ${snares.length} (${snares.join(' ')}) | ${chords.length} (${chords.join(' ')}) | ${hats} | ${floorN} · ${f(floorDye, 3)} | ${drops.join('/')} | ${nsp} | ${f(dv)} | ${f(dye, 2)} | ${f(m((r) => r.P.params.dyeDiss))} | ${f(m((r) => r.P.params.curl), 0)}`);
  }
  console.log(`# seconds with any injection ${tot.inj}/${tot.sec} · with the floor ${tot.floorSec} · with a chord shear ${tot.chordSec}`);
}
