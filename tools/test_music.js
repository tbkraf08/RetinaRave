// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// THE ENGINE ON MUSIC (DECISIONS §109; HARNESS "Real-music acceptance"): the node test of what the engine PUBLISHES on every library
// track and the user's pad take — the real MS traces tools/traces.sh records (tools/truth/traces/<Track>-map{1,0}.json, rec-map0.json:
// a deterministic cold-start file run, every recordable field per frame, 0 → 110 s), graded against each track's offline truth
// (tools/truth/<Track>.json: the bpm, the drops, the low / click onset densities) and against the contracts. The per-engine tests
// (test_drums / test_build / test_queue / test_clock / test_tongues / test_director) stay the UNIT tests of each rule on synthetic
// input; this file is where "it behaves right on music" is asserted — per track, the numbers printed, never an average that hides one.
//   node tools/test_music.js        ~10 s — in npm test
// Per trace:
//   shape     no non-finite value in any column; kickEvt / snareEvt / hatEvt are one frame wide (CONTRACTS §1.18: an event is a frame)
//   clock     `bpm` (the PCM clock, the default since §56) settles within 2 % of the truth tempo or its octave (×½ / ×2) from 20 s on,
//             and `beat` fires bpm/6 ± 15 % times per 10 s
//   map       mapDropEvt fires only with the map on (never on &map=0 / a take); on SeeYouDrop (the tuning track) within one frame of
//             each truth drop; every track's truth drops → the nearest mapDropEvt / dropEvt / dropLiveEvt lag is PRINTED (a map that
//             disagrees with the offline truth on a track is a finding for DECISIONS, not a tuning here)
//   tongues   where the truth has a beater (click onsets ≥ 1 / s over the rulers window) the tongues are ON (tongueOn 1) on ≥ 90 % of
//             the frames from 20 s; elsewhere the fraction is printed
//   drums     the reactive kick (`kick2` rising edges over .3) and the ears' kickEvt over the rulers window against the truth's CLICK
//             onsets (kicks with a beater — `low` is the 40–150 Hz level picker, a piano's left hand on Comptine) in the same window:
//             each within a factor of 4 of the truth where the truth has ≥ 0.5 clicks / s; the low count is printed beside them
//   build     (&map=0, the live detector) dropLiveEvt within 1 s of each SeeYouDrop truth drop; per track the false alarms (a
//             dropLiveEvt with no truth drop within 4 s) are printed and must stay ≤ 4 per 110 s — CyborgNinja (no drops) is the control
//   queue     where the tongues are on, queueN (the predicted-event queue, live step 5) is ≥ 1 on ≥ 80 % of the frames from 20 s
//   director  core/scenes.js's updateScenes driven by the real rows with stub scenes (test_director's harness): every dropEvt frame
//             hard-cuts to the home scene on that frame, and no switch AWAY from home lands inside SC.dwellMin (§95: 30 s, drawn
//             [30, 30] here) of the previous landing — a switch TO home (a drop, a drift, a build parking) may come any time
//   The rulers window (tools/truth/windows.json) is used where the trace covers it; where it starts past the trace's end (CyborgNinja's
//   loudest 30 s is at 138 s) the trace's last 60 s stand in.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MS } from '../assets/engine/state.js';
import { SC, register, updateScenes } from '../assets/core/scenes.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WIN = JSON.parse(fs.readFileSync(path.join(HERE, 'truth/windows.json'), 'utf8')).tracks;
let pass = 0, fail = 0;
let gate = true;   // false on a track that is not a gate (windows.json `gate`: Malicious, pending the user's validation of the map's sub ruler): its claims print as notes, never FAIL
const ok = (c, m) => { if (!gate) { console.log((c ? 'note ' : 'NOTE ') + m + (c ? '' : '  [would FAIL; not a gate]')); return; } if (c) { pass++; console.log('ok   ' + m); } else { fail++; console.log('FAIL ' + m); } };
const note = (m) => console.log('     ' + m);
const med = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[s.length >> 1] : NaN; };
const f2 = (x) => (isFinite(x) ? (+x).toFixed(2) : String(x));

function trace(name) {
  const f = path.join(HERE, 'truth/traces', name + '.json');
  if (!fs.existsSync(f)) { console.log('FAIL no trace ' + name + ' — record it: PORT=88xx tools/traces.sh ' + name); fail++; return null; }
  return JSON.parse(fs.readFileSync(f, 'utf8'));
}
function truth(track) {
  const f = path.join(HERE, 'truth', track + '.json');
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
}
// the truth's onsets per second over [a, b) from the 1 s grain: {low, click}
function truthOnsets(T, a, b) {
  const sl = T && T.slices && T.slices['1'] ? T.slices['1'] : [];
  let low = 0, click = 0, n = 0;
  for (const s of sl) if (s.t >= a && s.t < b) { low += s.low; click += s.click; n++; }
  return { low, click, n };
}

// the director harness (test_director.js): a home scene and two scorers; the real rows drive updateScenes
const looks = {}, mk = (id, name, score, home) => ({ id, name, home, rt: home ? { home: true } : {}, score, draw() {},
  look: home ? undefined : { get() { return looks[name]; }, set(v) { looks[name] = v; } } });
register(mk(0, 'home', (S) => 0.5 + (S.build || 0), true));
register(mk(1, 'one', (S) => (S.sectionAlt === 2 ? 0.9 : 0.1)));
register(mk(2, 'two', (S) => (S.sectionAlt === 3 ? 0.9 : 0.1)));
function director(J) {
  const C = J.cols, T = J.t, N = J.f.length, keys = Object.keys(C);
  // a fresh director per trace (SC is a singleton): the fields updateScenes integrates, at their boot values (scenes.js)
  Object.assign(SC, { cur: 0, logical: 0, next: -1, m: 0, variant: null, vT: 0, vmix: 0, lastBeat: -99, hist: [0], forced: -1, home: 0, mem: {}, prevAlt: -1, altOpen: false, due: -1,
    renumbers: 0, renumbered: null, filed: null, pend: null, restored: null, switched: null, since: 0, lands: 0, dwell: [30, 30], dwellMin: 30, quantise: true });
  const switches = [], dropCut = [], drops = [];
  let prev = -1, prevT = T[0] - 1 / 60, landed = T[0], close = 0;
  for (let i = 0; i < N; i++) {
    for (const k of keys) MS[k] = C[k][i];
    MS.sectionRenumber = null;
    const dt = Math.max(1e-3, Math.min(0.1, T[i] - prevT)); prevT = T[i];
    updateScenes(dt, MS);
    if (MS.dropEvt) { drops.push(T[i]); dropCut.push(SC.logical === 0); }
    if (SC.logical !== prev) {
      if (prev >= 0) {
        const sw = { t: +T[i].toFixed(2), from: prev, to: SC.logical, after: +(T[i] - landed).toFixed(1), why: MS.dropEvt ? 'drop' : MS.surpriseEvt ? 'surprise' : MS.identifyEvt ? 'identify' : MS.sectionReturn ? 'return' : SC.logical === 0 ? 'home' : 'soft' };
        switches.push(sw);
        if (SC.logical !== 0 && !MS.dropEvt && T[i] - landed < SC.dwellMin - 1 / 60) close++;
      }
      prev = SC.logical; landed = T[i];
    }
  }
  return { drops, dropCut, switches, close };
}

const names = [];
for (const t in WIN) { if (WIN[t].map0only) names.push(t + '-map0'); else names.push(t + '-map1', t + '-map0'); }
for (const name of names) {
  const J = trace(name); if (!J) continue;
  const track = name.replace(/-map[01]$/, ''), map = name.endsWith('-map1') ? 1 : 0, W = WIN[track], TR = truth(track);
  gate = W.gate !== false;
  const C = J.cols, T = J.t, N = J.f.length, tEnd = T[N - 1];
  const sel = (k, a, b) => C[k].filter((v, i) => T[i] >= a && T[i] < b);
  const cnt = (k, a, b) => sel(k, a, b).filter(Boolean).length;
  const at = (k) => T.filter((t, i) => C[k][i]).map((t) => +t.toFixed(3));
  const edges = (k, a, b, th) => { let n = 0, p = 0; for (let i = 0; i < N; i++) { if (T[i] < a || T[i] >= b) continue; const v = C[k][i]; if (v >= th && p < th) n++; p = v; } return n; };
  console.log(`== ${name}: ${N} frames · ${f2(T[0])} → ${f2(tEnd)} s · mapOn ${med(C.mapOn)} · truth bpm ${W.bpm} drops ${JSON.stringify(W.drops)}`);

  // shape
  const nulls = Object.keys(C).filter((k) => C[k].some((v) => v === null));
  ok(nulls.length === 0, `shape: ${name} — no non-finite value in ${Object.keys(C).length} columns${nulls.length ? ' (' + nulls.join(',') + ')' : ''}`);
  let dbl = 0; for (const k of ['kickEvt', 'snareEvt', 'hatEvt']) for (let i = 1; i < N; i++) if (C[k][i] && C[k][i - 1]) dbl++;
  ok(dbl === 0, `shape: ${name} — kickEvt / snareEvt / hatEvt are one frame wide (${dbl} doubled)`);

  // clock
  const bpm = med(sel('bpm', 20, tEnd)), beats10 = [];
  for (let a = 20; a + 10 <= tEnd; a += 10) beats10.push(cnt('beat', a, a + 10));
  if (W.bpm) {
    const ratio = bpm / W.bpm, oct = [0.5, 1, 2].find((o) => Math.abs(ratio / o - 1) <= 0.02);
    ok(!!oct, `clock: ${name} — bpm ${f2(bpm)} is the truth's ${W.bpm} × ${oct || '?'} (ratio ${ratio.toFixed(3)}, ≤ 2 %)`);
    const want = bpm / 6, off = beats10.filter((b) => Math.abs(b - want) > 0.15 * want).length;
    ok(off === 0, `clock: ${name} — beat fires ${f2(want)} ± 15 % per 10 s from 20 s (${beats10.join(' ')}; ${off} windows off)`);
  } else note(`clock: ${name} — bpm ${f2(bpm)} (no truth tempo for the take), beats per 10 s ${beats10.join(' ')}`);

  // map
  const mapDrops = at('mapDropEvt'), dropEvts = at('dropEvt'), liveDrops = at('dropLiveEvt');
  if (map === 0) ok(mapDrops.length === 0, `map: ${name} — no mapDropEvt without the map (${mapDrops.length})`);
  else {
    const lag = (d, L) => { const n = L.reduce((b, x) => (Math.abs(x - d) < Math.abs(b - d) ? x : b), 1e9); return n === 1e9 ? 'none' : (n - d >= 0 ? '+' : '') + (n - d).toFixed(3); };
    for (const d of W.drops.filter((d) => d <= tEnd)) note(`map: ${name} — truth drop ${d.toFixed(3)} s: mapDropEvt ${lag(d, mapDrops)} · dropEvt ${lag(d, dropEvts)} · dropLiveEvt ${lag(d, liveDrops)}`);
    if (mapDrops.length) note(`map: ${name} — mapDropEvt at ${JSON.stringify(mapDrops)}`);
    if (track === 'SeeYouDrop') {
      const near = W.drops.map((d) => mapDrops.some((m) => Math.abs(m - d) <= 1 / 60 + 1e-6));
      ok(near.every(Boolean) && mapDrops.length === W.drops.length, `map: SeeYouDrop — mapDropEvt within one frame of each truth drop ${JSON.stringify(W.drops)} → ${JSON.stringify(mapDrops)}`);
    }
  }

  // tongues / drums / queue over the rulers window (clipped to the trace; the last 60 s where the window lies past it)
  const R = W.rulers, a = R.from + 10 <= tEnd ? R.from : Math.max(20, tEnd - 60), b = Math.min(R.from + 10 <= tEnd ? R.to : tEnd, tEnd), on = TR ? truthOnsets(TR, a, b) : { low: 0, click: 0, n: 0 };
  const secs = Math.max(1, b - a);
  const tOn = sel('tongueOn', 20, tEnd), onFrac = tOn.length ? tOn.filter((v) => v === 1).length / tOn.length : 0;
  const beater = on.click / secs >= 1;
  if (beater) ok(onFrac >= 0.9, `tongues: ${name} — on (tongueOn 1) on ${(100 * onFrac).toFixed(1)} % of the frames from 20 s (the truth has ${f2(on.click / secs)} click onsets / s)`);
  else note(`tongues: ${name} — on ${(100 * onFrac).toFixed(1)} % of the frames from 20 s (the truth has ${f2(on.click / secs)} click onsets / s over ${a}–${b}: no beater, not asserted)`);
  const k2 = edges('kick2', a, b, 0.3), kE = cnt('kickEvt', a, b), clickRate = on.click / secs;
  if (clickRate >= 0.5) {
    ok(k2 >= on.click / 4 && k2 <= on.click * 4, `drums: ${name} — kick2 rises ${k2} times over ${a}–${b} s against ${on.click.toFixed(0)} truth clicks (×${(k2 / on.click).toFixed(2)}, within ×4; low ${on.low.toFixed(0)})`);
    ok(kE >= on.click / 4 && kE <= on.click * 4, `drums: ${name} — kickEvt ${kE} over ${a}–${b} s against ${on.click.toFixed(0)} truth clicks (×${(kE / on.click).toFixed(2)}, within ×4; low ${on.low.toFixed(0)})`);
  } else note(`drums: ${name} — kick2 rises ${k2}, kickEvt ${kE} over ${a}–${b} s; the truth has ${f2(clickRate)} clicks / s, ${f2(on.low / secs)} low onsets / s (no beater, not asserted)`);
  note(`levels: ${name} — snare2 rises ${edges('snare2', a, b, 0.3)} snareEvt ${cnt('snareEvt', a, b)} · hat2 rises ${edges('hat2', a, b, 0.3)} hatEvt ${cnt('hatEvt', a, b)} · onset ${cnt('onset', a, b)} · presence ${f2(med(sel('presence', a, b)))} loudRel ${f2(med(sel('loudRel', a, b)))} subGate ${(100 * sel('subGate', a, b).filter((v) => v > 0).length / Math.max(1, sel('subGate', a, b).length)).toFixed(0)} % · key ${med(sel('key', a, b))} keyConf ${f2(med(sel('keyConf', a, b)))}`);
  const q = sel('queueN', 20, tEnd), qFrac = q.length ? q.filter((v) => v >= 1).length / q.length : 0;
  if (beater && onFrac >= 0.9) ok(qFrac >= 0.8, `queue: ${name} — queueN ≥ 1 on ${(100 * qFrac).toFixed(1)} % of the frames from 20 s (median ${med(q)})`);
  else note(`queue: ${name} — queueN ≥ 1 on ${(100 * qFrac).toFixed(1)} % of the frames from 20 s (median ${med(q)}; not asserted without the tongues)`);

  // build (the live detector, &map=0)
  if (map === 0 && track !== 'rec') {
    const falseA = liveDrops.filter((x) => !W.drops.some((d) => Math.abs(x - d) <= 4)).length;
    note(`build: ${name} — dropLiveEvt at ${JSON.stringify(liveDrops)} · false alarms (no truth drop within 4 s) ${falseA} · buildLive max ${f2(Math.max(0, ...C.buildLive))}`);
    ok(falseA <= 4, `build: ${name} — ≤ 4 false live drops per 110 s (${falseA})`);
    if (track === 'SeeYouDrop') ok(W.drops.every((d) => liveDrops.some((x) => Math.abs(x - d) <= 1)), `build: SeeYouDrop — dropLiveEvt within 1 s of each truth drop → ${JSON.stringify(liveDrops)}`);
  }

  // director
  if (track !== 'rec') {
    const D = director(J);
    ok(D.dropCut.every(Boolean), `director: ${name} — every dropEvt frame (${D.drops.length}: ${JSON.stringify(D.drops.map((t) => +t.toFixed(1)))}) hard-cuts to the home scene on that frame`);
    note(`director: ${name} — switches ${JSON.stringify(D.switches)}`);
    ok(D.close === 0, `director: ${name} — ${D.switches.length} switches, none away from home inside the ${SC.dwellMin} s dwell of the previous landing (${D.close} were)`);
  }
}

gate = true;
console.log(`test_music: ${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
