// Node test for assets/engine/map: build the whole-track map of SeeYouDrop and grade it against tools/truth.
//   node tools/test_map.js                          # both rates
//   node tools/test_map.js --sr=44100 --others      # also report what the map finds on the other three tracks
import fs from 'fs';
import path from 'path';
import { loadPcm } from './test_ears.js';
import { buildMap, mapAt, mapCross } from '../assets/engine/map/map.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const arg = (k, d) => { const a = process.argv.find((v) => v.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const has = (k) => process.argv.includes('--' + k);
let FAIL = 0;
const ok = (name, pass, value, target) => {
  if (!pass) FAIL++;
  console.log('  ' + (pass ? 'pass' : 'FAIL') + '  ' + name.padEnd(38) + String(value).padEnd(46) + (target || ''));
};
const NAMES = 'C C# D D# E F F# G G# A A# B'.split(' ');

const truth = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/truth/SeeYouDrop.json'), 'utf8'));
const ann = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/truth/SeeYouDrop.sections.json'), 'utf8'));

function grade(map, sr) {
  const T = `[${sr}]`;
  // the phase is only meaningful modulo the beat, and signed toward the nearer neighbour
  let dph = (map.phase - truth.bpm_grid.phase) % map.beat;
  if (dph > map.beat / 2) dph -= map.beat; else if (dph < -map.beat / 2) dph += map.beat;
  ok(`${T} grid vs the truth`, Math.abs(map.bpm - truth.bpm_grid.bpm) < 0.5 && Math.abs(dph) < 0.06,
    `${map.bpm.toFixed(3)} bpm phase ${map.phase.toFixed(4)} (${(1000 * dph).toFixed(0)} ms vs truth mod beat) coh ${map.grid.coh.toFixed(3)} drift ${(100 * (1 - map.grid.dpAgree)).toFixed(2)} %`,
    `truth ${truth.bpm_grid.bpm} / ${truth.bpm_grid.phase}`);
  // the DOWNBEAT grid against the truth's: the mod-4 index is only meaningful with the same phase, the times are what matter
  const tdb = truth.downbeats;
  const dd = tdb.map((v) => { let b = map.downbeats[0]; for (const q of map.downbeats) if (Math.abs(q - v) < Math.abs(b - v)) b = q; return b - v; });
  const inHalf = dd.filter((d) => Math.abs(d) <= 0.5 * map.beat).length;
  ok(`${T} downbeats vs the truth's`, inHalf >= 0.9 * tdb.length,
    `${inHalf} of ${tdb.length} within half a beat, median ${(1000 * dd.slice().sort((a, b) => a - b)[dd.length >> 1]).toFixed(0)} ms`,
    '>= 90 %');
  // drops: exactly the truth's, within 1 frame at 60 Hz
  const td = truth.drops, FR = 1 / 60;
  const hit = td.map((v) => { let b = null; for (const d of map.drops) if (b === null || Math.abs(d - v) < Math.abs(b - v)) b = d; return b === null ? null : b - v; });
  const extra = map.drops.filter((d) => !td.some((v) => Math.abs(d - v) <= 2 * FR));
  ok(`${T} drops = the truth's, +-1 frame`, hit.every((d) => d !== null && Math.abs(d) <= FR) && extra.length === 0,
    `[${map.drops.map((d) => d.toFixed(3)).join(' ')}] (${map.dropWhy.join(',')}), delta ${hit.map((d) => (d === null ? 'miss' : (1000 * d).toFixed(0) + 'ms')).join(' ')}`,
    `truth [${td.join(' ')}], no extras`);
  ok(`${T} no drop in the intro (9-13 s)`, !map.drops.some((d) => d >= 8 && d < 14), map.drops.filter((d) => d < 14).length + ' in 0-14 s', 'none');
  // boundaries against the hand annotation, and against E0's automatic sections
  // v2 of the annotation pins every boundary to its bar line AND states that the last section's t1 is the file's duration,
  // not a boundary (the map forces it, so no detector fires there and grading it as one is grading a constant).
  const abn = ann.sections.map((s) => s.t0).concat(ann.end_is_not_a_boundary ? [] : [ann.sections[ann.sections.length - 1].t1]);
  const auto = map.sections.map((s) => s.t0).concat([map.sections[map.sections.length - 1].t1]);
  const rows = abn.map((a) => { let b = auto[0]; for (const v of auto) if (Math.abs(v - a) < Math.abs(b - a)) b = v; return [a, b, (b - a) / map.beat]; });
  const within = rows.filter(([, , d]) => Math.abs(d) <= 1).length;
  const unreach = abn.filter((a) => Math.abs((map.phase + map.bar * Math.round((a - map.phase) / map.bar)) - a) / map.beat > 1).length;
  ok(`${T} boundaries within +-1 beat`, within >= abn.length - unreach - 1,
    `${within} of ${abn.length} (${unreach} annotated times have NO bar line within a beat)`, `>= ${abn.length - unreach - 1}`);
  console.log('    truth | map | delta beats');
  for (const [a, b, d] of rows) console.log(`    ${a.toFixed(2).padStart(7)} | ${b.toFixed(3).padStart(8)} | ${d >= 0 ? '+' : ''}${d.toFixed(2)}${Math.abs(d) <= 1 ? '' : '   MISS'}`);
  // the three annotated return pairs
  // A pair counts as labelled when some map section overlapping the annotation's A range shares a cluster with a section
  // overlapping its B range AND that later section carries ret = 1. Midpoint to midpoint is too strict: a 20-bar annotated
  // section legitimately splits into two clusters and only one of them is the one that comes back.
  const labsIn = (a, b) => new Set(map.sections.filter((q) => q.t1 > a && q.t0 < b).map((q) => q.label));
  const pairs = ann.returns.map((r) => {
    const nums = (s) => (s.match(/\d+(?:\.\d+)?/g) || []).slice(-2).map(Number);
    const [a0, a1] = nums(r.a), [b0, b1] = nums(r.b);
    const A = labsIn(a0, a1), B = labsIn(b0, b1);
    const shared = [...B].filter((l) => A.has(l));
    const flagged = map.sections.some((q) => q.t1 > b0 && q.t0 < b1 && q.ret && shared.includes(q.label));
    return [r.a, r.b, [...A].join(','), [...B].join(','), shared.length > 0 && flagged];
  });
  const retOk = pairs.filter((q) => q[4]).length;
  const retFlag = map.sections.filter((s) => s.ret).length;
  ok(`${T} the three returns labelled`, retOk === pairs.length,
    `${retOk} of ${pairs.length} pairs share a cluster; ${retFlag} sections carry ret=1`, 'all 3');
  for (const [a, b, x, y, okp] of pairs) console.log(`    ${a.padEnd(24)} <-> ${b.padEnd(24)} labels {${x}} / {${y}} ${okp ? 'OK' : 'MISS'}`);
  ok(`${T} tonic`, map.tonic.pc === truth.tonic.pc && map.tonic.minor === (truth.tonic.minor ? 1 : 0),
    `${NAMES[map.tonic.pc]}${map.tonic.minor ? ' minor' : ' major'} conf ${map.tonic.conf.toFixed(3)}`,
    `truth ${truth.tonic.name}${truth.tonic.minor ? ' minor' : ' major'}`);
  // toDrop counts down through the void, buildProg 0 -> 1 across the build
  const at = (t) => mapAt(map, t, {});
  const td1 = map.drops[0];
  const walk = [50, 52, 54, 56, 57.5].map((t) => at(t).toDrop);
  let mono = true;
  for (let i = 1; i < walk.length; i++) if (!(walk[i] < walk[i - 1])) mono = false;
  ok(`${T} toDrop counts down through the void`, mono && Math.abs(walk[0] - (td1 - 50) / map.beat) < 0.01,
    walk.map((v) => v.toFixed(1)).join(' -> ') + ' beats', 'strictly falling');
  const bp = [49.9, 52, 55, 57.5, 57.61].map((t) => at(t).buildProg);
  ok(`${T} buildProg 0 -> 1 across the build`, bp[0] <= 0.15 && bp[3] >= 0.85 && bp.every((v, i) => i === 0 || v >= bp[i - 1] - 1e-9),
    bp.map((v) => v.toFixed(2)).join(' '), '0 at the start, 1 at the drop');
  // mapCross at 60 Hz: each drop fires on exactly one frame, and nowhere else
  let dropFrames = 0, bndFrames = 0, dropTimes = [];
  for (let f = 0; f < Math.floor(map.dur * 60); f++) {
    const c = mapCross(map, f / 60, (f + 1) / 60);
    if (c.drop) { dropFrames++; dropTimes.push((f + 1) / 60); }
    if (c.boundary) bndFrames++;
  }
  ok(`${T} mapCross drop frames`, dropFrames === map.drops.length,
    `${dropFrames} frames at ${dropTimes.map((v) => v.toFixed(3)).join(' ')}`, `${map.drops.length}, one each`);
  // the first section starts at t = 0, which no frame's (tPrev, t] can contain, so one fewer than the section count
  ok(`${T} mapCross boundary frames`, bndFrames === map.sections.length - 1,
    `${bndFrames} frames`, `${map.sections.length - 1} (every boundary but t = 0)`);
  // eG p95 per annotated section
  const g = map.eG;
  const p95 = (a, b) => {
    const v = [];
    for (let i = Math.round(a * g.fps); i < Math.min(g.v.length, Math.round(b * g.fps)); i++) v.push(g.v[i]);
    v.sort((x, y) => x - y);
    return v.length ? v[Math.floor(0.95 * (v.length - 1))] : 0;
  };
  ok(`${T} eG p95 per section`, true, ann.sections.map((s) => `${s.label} ${p95(s.t0, s.t1).toFixed(2)}`).join(' '), 'reported');
  gradeOnsets(map, T);
  gradeSub(map, T);
}

// --- v0.15 pass 2: the non-causal channels. They ARE the truth's own front end, so the bar is exact agreement.
const F1 = (det, ref, tol = 0.030) => {
  const used = new Uint8Array(ref.length);
  let tp = 0;
  for (const t of det) {
    let bi = -1, bd = 1e9;
    for (let i = 0; i < ref.length; i++) if (!used[i] && Math.abs(ref[i] - t) < bd) { bd = Math.abs(ref[i] - t); bi = i; }
    if (bi >= 0 && bd <= tol) { used[bi] = 1; tp++; }
  }
  const P = det.length ? tp / det.length : 0, R = ref.length ? tp / ref.length : 0;
  return { F: P + R ? 2 * P * R / (P + R) : 0, P, R, tp, miss: ref.length - tp, extra: det.length - tp };
};
const inWin = (a, w) => (w ? a.filter((t) => t >= w[0] && t < w[1]) : a);

function gradeOnsets(map, T) {
  const O = map.onsets, tr = truth.onsets;
  const t = (a) => a.map((e) => e.t);
  for (const [nm, got, ref] of [['low', O.low, tr.low], ['snare', O.snare, tr.mid], ['hat', O.hat, tr.high], ['kick', O.kick, tr.click]]) {
    const r = F1(t(got), ref);
    ok(`${T} onsets.${nm} = the truth's`, r.F >= 0.98, `F ${r.F.toFixed(3)} (${got.length} vs ${ref.length}, tp ${r.tp} miss ${r.miss} extra ${r.extra})`, '>= 0.98');
  }
  for (const w of [[25, 45], [57.6, 90], null]) {
    const r = F1(inWin(t(O.kick), w), inWin(tr.click, w));
    ok(`${T} kick F ${w ? w.join('-') + ' s' : 'whole track'}`, w ? r.F >= 0.9 : true,
      `${r.F.toFixed(3)} (P ${r.P.toFixed(3)} R ${r.R.toFixed(3)})`, w ? '>= 0.90' : 'reported');
  }
  const bare = truth.bare808;
  const on = t(O.kick).filter((v) => bare.some((b) => Math.abs(b - v) <= 0.015)).length;
  ok(`${T} kicks on a truth bare808`, 100 * on / Math.max(1, O.kick.length) <= 5,
    `${(100 * on / Math.max(1, O.kick.length)).toFixed(1)} % (${on}/${O.kick.length})`, '<= 5 %');
  const vel = t(O.kick).length ? O.kick.map((e) => e.vel) : [0];
  ok(`${T} onset velocities in 0..1`, vel.every((v) => v >= 0 && v <= 1), `kick vel med ${vel.slice().sort((a, b) => a - b)[vel.length >> 1]}`, '0..1');
}

function gradeSub(map, T) {
  const P = map.sub, ct = truth.contour.f0td, cf = ct.fpsExact || ct.fps;
  // frame by frame against the truth's own contour, on the frames both call voiced
  let both = 0, ok30 = 0, oct = 0; const cs = [];
  const n = Math.min(ct.f0.length, P.n);
  for (let i = 0; i < n; i++) {
    if (!(ct.f0[i] > 0) || !(P.hz[i] > 0)) continue;
    both++;
    const c = 1200 * Math.log2(P.hz[i] / ct.f0[i]);
    cs.push(Math.abs(c));
    if (Math.abs(c) <= 30) ok30++;
    if (Math.abs(Math.abs(c) - 1200) < 60) oct++;
  }
  cs.sort((a, b) => a - b);
  ok(`${T} sub +-30 cents of contour.f0td`, 100 * ok30 / Math.max(1, both) >= 90,
    `${(100 * ok30 / Math.max(1, both)).toFixed(1)} % of ${both} (med |c| ${cs[cs.length >> 1].toFixed(1)}, octave ${(100 * oct / Math.max(1, both)).toFixed(2)} %)`, '>= 90 %');
  ok(`${T} sub frame grid = the truth's`, P.n === ct.f0.length && Math.abs(P.fps - cf) < 0.01,
    `${P.n} frames at ${P.fps} Hz, t0 ${P.t0}`, `${ct.f0.length} at ${cf.toFixed(4)}`);
  // subNote against the truth's own per-beat slice note (the MEDIAN over the slice, as the truth builds it)
  let nb = 0, agree = 0;
  for (const s of truth.slices.beat) {
    if (!s.note || s.note === '-' || !(s.f0 > 0)) continue;
    const pc = NAMES.indexOf(String(s.note).replace(/-?\d+$/, ''));
    if (pc < 0) continue;
    const v = [];
    for (let i = Math.max(0, Math.round((s.t - P.t0) * P.fps)); i < Math.min(P.n, Math.round((s.t + (s.dt || map.beat) - P.t0) * P.fps)); i++) if (P.hz[i] > 0) v.push(P.hz[i]);
    if (!v.length) continue;
    v.sort((a, b) => a - b);
    const mi = Math.round(69 + 12 * Math.log2(v[v.length >> 1] / 440));
    nb++; if (((mi % 12) + 12) % 12 === pc) agree++;
  }
  ok(`${T} subNote per beat`, 100 * agree / Math.max(1, nb) >= 90, `${agree}/${nb} = ${(100 * agree / nb).toFixed(1)} %`, '>= 90 %');
  // subIn on the drops' bar lines, and the gate's edge rate through the gated section
  const near = (a, v) => a.reduce((b, x) => (Math.abs(x - v) < Math.abs(b - v) ? x : b), 1e9);
  const d0 = truth.drops[0], d1 = truth.drops[1];
  ok(`${T} subIn on the drops' bar lines`, Math.abs(near(P.inT, d0) - d0) <= 0.05 && Math.abs(near(P.inT, d1) - d1) <= 0.1,
    `${near(P.inT, d0).toFixed(4)} (${(1000 * (near(P.inT, d0) - d0)).toFixed(0)} ms) / ${near(P.inT, d1).toFixed(4)} (${(1000 * (near(P.inT, d1) - d1)).toFixed(0)} ms)`,
    `truth ${d0} / ${d1}, <= 50 / 100 ms`);
  const edges = P.inT.concat(P.outT).filter((v) => v >= 105.7 && v < 130.5).length;
  ok(`${T} subGate ducks through drop 2`, edges / ((130.5 - 105.7) / map.bar) >= 0.5,
    `${(edges / ((130.5 - 105.7) / map.bar)).toFixed(2)} gate edges per bar`, '>= 0.5/bar');
  // The walk's four notes. The reference is the truth's OWN contour arrival nearest each annotated time, read at the
  // correct frame rate (`fpsExact`): the annotated 13.0 / 16.1 / 19.3 / 22.6 are 10 Hz `sub_runs` labels, not attacks
  // (docs/workers/ears.md §2.3), and reading the contour at the nominal 100 Hz moves them another 30-50 ms.
  const arr = [];
  let prev = -1, runN = -1, runS = 0;
  for (let i = 0; i < ct.f0.length; i++) {
    const nt = ct.f0[i] > 0 ? ((Math.round(69 + 12 * Math.log2(ct.f0[i] / 440)) % 12) + 12) % 12 : -1;
    if (nt !== runN) { runN = nt; runS = i; }
    // a run of >= 20 frames (200 ms) at one note is a NOTE; shorter is the wobble inside an attack
    if (nt >= 0 && nt !== prev && i - runS >= 20) { arr.push(ct.t0 + runS / cf); prev = nt; }
  }
  void arr;
  const walk = (ann.walk || []).map((w) => w.arrival);
  const atk = (ann.walk || []).map((w) => w.attack);
  const lags = walk.map((v) => near(P.noteT, v) - v);
  const alag = atk.map((v) => near(P.noteT, v) - v);
  ok(`${T} the walk's notes vs the v2 arrivals`, walk.length > 0 && lags.every((l) => Math.abs(l) <= 0.05),
    walk.map((v, i) => `${v.toFixed(3)}${lags[i] >= 0 ? '+' : ''}${(1000 * lags[i]).toFixed(0)}ms`).join(' '), 'each <= 50 ms');
  ok(`${T} ... and vs the v2 bar-line attacks`, atk.every((v, i) => Math.abs(alag[i]) <= 0.05),
    atk.map((v, i) => `${v.toFixed(3)}${alag[i] >= 0 ? '+' : ''}${(1000 * alag[i]).toFixed(0)}ms`).join(' '), 'each <= 50 ms');
}

function main() {
  const rates = arg('sr') ? [Number(arg('sr'))] : [44100, 48000];
  let m0 = null;
  for (const sr of rates) {
    const pcm = loadPcm('SeeYouDrop', sr);
    const prof = {};
    const t0 = process.hrtime.bigint();
    const map = buildMap(pcm.L, pcm.R, pcm.sr, { prof });
    const t1 = process.hrtime.bigint();
    const ms = Number(t1 - t0) / 1e6;
    console.log(`\n=== map @ ${pcm.sr} Hz  built in ${(ms / 1000).toFixed(2)} s  (${map.beats.length} beats, ${map.downbeats.length} bars, ${map.sections.length} sections)`);
    console.log('    cost split (ms): ' + Object.entries(prof).map(([k, v]) => `${k} ${v}`).join(' · '));
    ok(`[${sr}] buildMap cost`, ms <= 3000, `${(ms / 1000).toFixed(2)} s`, '<= 3 s');
    grade(map, sr);
    if (sr === 44100) {
      const again = buildMap(pcm.L, pcm.R, pcm.sr);
      ok(`[${sr}] deterministic`, JSON.stringify(again) === JSON.stringify(map), `${JSON.stringify(map).length} bytes, two builds`, 'identical');
      m0 = map;
      fs.writeFileSync(path.join(ROOT, 'tools/work/map-SeeYouDrop.json'), JSON.stringify(map));
    }
  }
  if (has('others')) {
    for (const t of ['CyborgNinja', 'WhoLikesToParty', 'Malicious']) {
      const p = path.join(ROOT, 'tools/work', t + '.st.f32');
      if (!fs.existsSync(p)) { console.log(`\n--- ${t}: no PCM dump (run trackmap.py ${t} --pcm)`); continue; }
      const pcm = loadPcm(t, 44100);
      const a = process.hrtime.bigint();
      const map = buildMap(pcm.L, pcm.R, pcm.sr);
      const ms = Number(process.hrtime.bigint() - a) / 1e6;
      const tr = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/truth', t + '.json'), 'utf8'));
      console.log(`\n--- ${t}  ${(pcm.n / pcm.sr).toFixed(1)} s, built in ${(ms / 1000).toFixed(2)} s`);
      console.log(`    map:   ${map.bpm.toFixed(2)} bpm  drops [${map.drops.map((d) => d.toFixed(2)).join(' ')}] (${map.dropWhy.join(',')})  ${map.sections.length} sections, ${map.sections.filter((s) => s.ret).length} returns  tonic ${NAMES[map.tonic.pc]}${map.tonic.minor ? 'm' : 'M'} ${map.tonic.conf.toFixed(2)}`);
      console.log(`    truth: ${tr.bpm_grid.bpm.toFixed(2)} bpm  drops [${tr.drops.map((d) => d.toFixed(2)).join(' ')}]  ${tr.sections.length} sections, ${tr.sections.filter((s) => s.ret).length} returns  tonic ${tr.tonic.name}${tr.tonic.minor ? 'm' : 'M'} ${tr.tonic.conf.toFixed(2)}`);
    }
  }
  console.log(FAIL ? `\n${FAIL} FAILED` : '\nall map rulers pass');
  process.exit(FAIL ? 1 : 0);
}
main();
