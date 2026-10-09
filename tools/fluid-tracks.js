// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// Solver after Pavel Dobryakov, WebGL-Fluid-Simulation (MIT, 2017) — https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
// The fluid grammar's PER-TRACK TABLE (DECISIONS §111; HARNESS "## Fluid" — the per-track tuning recipe): plan() of
// core/fluid/inject.js replayed, with no GL, over every library track in both map modes and the pad take, one row each —
// what the pool is TOLD per track, so a grammar change is read as "what it bought on which track" before any shot is taken.
//   node tools/fluid-tracks.js                       the table (markdown) on stdout; every track + the pad
//   TRACKS="SeeYouDrop rec" MODES="1" node …          a scope; FLUIDK='{"HAT_RATE":99}' node …   a K override (an A/B of one knob)
//   JSON=tools/work/x.json node …                    also the rows as JSON (for a before → after diff)
//   INJECT=/tmp/inject-before.js node …              replay another grammar (git show <rev>:assets/core/fluid/inject.js > /tmp/inject-before.js)
// The traces: tools/work/fluid-tracks/<Track>/trace-map{1,0}.json (the whole track, FLUID-TRACKS-2026-10-09 §1: filetrace.js with
// FLUID_FEATS + the fields below) when present, else tools/truth/traces/<Track>-map{1,0}.json (0 → 110 s, every field; tools/traces.sh);
// the pad take is tools/truth/traces/rec-map0.json. Missing → the row says so. Malicious is in the table for the record only
// (windows.json gate: false — the user: "can ignore malicious until I validate the ruler").
// The columns (music seconds = presence > .5 and rms > .003 over the second, as the survey counted):
//   inj %        seconds with music that inject anything (the ≥ 95 % gate of test_fluid's music block)
//   sub/kick/snare/chord/hat/floor   seconds with that channel (and hits / droplets per music second)
//   ink/s        the injected ink per second, AREA-WEIGHTED (Σ dye · (rad / RADIUS)²: a kick's ×2 radius is 4× the ink of a snare's
//                at the same dye) — p50 / p90 over music seconds; the governor's budget (K.INK_BUDGET) is in these units, and
//                (gov) is its factor on dyeDiss, max(1, rate / INK_BUDGET), p50 / p90 over music frames (1.0 = never governed)
//   dv/s         Σ|dv| injected per second, p50 (uv/s)
//   void %       frames with dyeDiss < .5 · deep void % frames with dyeDiss < .3 (the latched void, §111 item 4) · syrup % frames with velDiss > 1
//   clears       confirmed clears (the count, then each one's second; a clear = the frame dyeDiss first reads DROP_DISS);
//                true = within 1.5 s of a truth drop (tools/truth/windows.json) or of a map bar line; brk = inside IBelongHere's
//                144–178 s breakdown (the false-arm window the survey found)
//   x sub        the sub emitter's x: p10 / p50 / p90 over the frames the gate is open, and the span p90 − p10 (0 = pinned)
//   x hits       the kick / snare / chord splats' x: p10 / p90 (the survey's "three fixed points" read .3 / .7 everywhere)
//   kick dy      the kick impulse, p10 / p50 / p90 (uv/s) — the size law's room
//   hue          % of frames the pool's hue is the KEY's (the anchor's conf 1) · the hue bins (of 12) visited at 1 Hz · the hue at
//                the survey's window seconds (windows.txt) — one bin all track = one colour
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(HERE, '..');
// INJECT=<path to another inject.js> replays THAT grammar (a `git show <rev>:assets/core/fluid/inject.js > /tmp/x.js` is the before)
const { plan, mkState, FLUID_FEATS, K } = await import(process.env.INJECT ? pathToFileURL(path.resolve(process.env.INJECT)).href : '../assets/core/fluid/inject.js');
if (process.env.FLUIDK) Object.assign(K, JSON.parse(process.env.FLUIDK));
const WIN = JSON.parse(fs.readFileSync(path.join(HERE, 'truth/windows.json'), 'utf8')).tracks;
const TRACKS = (process.env.TRACKS || 'SeeYouDrop Vienna IBelongHere CyborgNinja WhoLikesToParty Comptine Malicious rec').split(/\s+/).filter(Boolean);
const MODES = (process.env.MODES || '1 0').split(/\s+/).filter(Boolean);
const BRK = { IBelongHere: [144, 178] };   // the survey's false-arm window (FLUID-TRACKS §4)
const SURVEY = {};   // the survey's window seconds per track (tools/work/fluid-tracks/windows.txt when present)
try { for (const l of fs.readFileSync(path.join(ROOT, 'tools/work/fluid-tracks/windows.txt'), 'utf8').split('\n')) { const m = l.match(/^(\w+) \| (.*?) \|/); if (m) SURVEY[m[1]] = m[2].split(/\s+/).map((s) => +s.split(':')[1]); } } catch (e) { /* no survey dir: the windows.json shots instead */ }

const q = (a, p) => { if (!a.length) return NaN; const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const f = (v, d = 2) => (v == null || !isFinite(+v) ? '—' : (+v).toFixed(d));
const hsvHue = (c) => { const [r, g, b] = c; const M = Math.max(r, g, b), m = Math.min(r, g, b), d = M - m; if (d < 1e-9) return 0; let h = M === r ? ((g - b) / d) % 6 : M === g ? (b - r) / d + 2 : (r - g) / d + 4; return ((h / 6) + 1) % 1; };
const ORDER = ['sub', 'kick', 'snare', 'chord', 'hat', 'floor', 'drop'];

function traceOf(track, mode) {
  const a = path.join(ROOT, 'tools/work/fluid-tracks', track, 'trace-map' + mode + '.json'), b = path.join(ROOT, 'tools/truth/traces', track + '-map' + mode + '.json');
  if (track !== 'rec' && fs.existsSync(a)) return { file: a, whole: true };
  if (fs.existsSync(b)) return { file: b, whole: false };
  return null;
}

function row(track, mode) {
  const tr = traceOf(track, mode);
  if (!tr) return { track, mode, missing: true };
  const J = JSON.parse(fs.readFileSync(tr.file, 'utf8')), C = J.cols, T = J.t, N = J.f.length;
  const st = mkState(), rows = [];
  let prev = null, dropsPrev = 0;
  for (let i = 0; i < N; i++) {
    const S = {}; for (const k in C) S[k] = C[k][i];
    S.seed = { a: 0.37 }; S.subNote = S.subNote == null ? -1 : S.subNote;
    for (const k of FLUID_FEATS) if (!(k in S)) S[k] = 0;
    const dt = prev === null ? 1 / 60 : Math.max(1e-3, Math.min(0.1, T[i] - prev)); prev = T[i];
    const P = plan(S, dt, st, 0.6);
    // the splats' kinds: plan() tags them (`k`, §111); a plan without tags is classified by the emit order (the §104–§109 grammar)
    let kinds;
    if (P.splats.length && P.splats[0].k !== undefined) kinds = P.splats.map((s) => s.k);
    else {
      const kAge = S.kickAge < 99 ? Math.max(0, S.kickAge) : 99;
      const want = { sub: S.subGate > 0 ? 1 : 0, kick: S.kickEvt || kAge < 2 / 60 ? 1 : 0, snare: S.snareEvt ? 2 : 0, chord: P.chord > 0 ? 2 : 0, hat: S.hat2 > 0.3 ? Math.min(3, Math.round(S.denH)) : 0, floor: P.floor > 0 ? 1 : 0, drop: S.dropLiveEvt || S.mapDropEvt ? 1 : 0 };
      kinds = []; for (const k of ORDER) for (let j = 0; j < want[k]; j++) kinds.push(k);
    }
    const clear = P.params.dyeDiss >= K.DROP_DISS ? 1 : 0;
    rows.push({ t: +T[i], S, P, kinds, xSub: st.xSub, clearEdge: clear && !dropsPrev ? 1 : 0, conf: st.anchor.OUT.conf });
    dropsPrev = clear;
  }
  const by = new Map(); for (const r of rows) { const s = Math.floor(r.t); if (!by.has(s)) by.set(s, []); by.get(s).push(r); }
  const m = (rs, fn) => rs.reduce((a, r) => a + fn(r), 0) / rs.length;
  const secs = [...by.entries()].sort((a, b) => a[0] - b[0]).map(([s, rs]) => {
    const music = m(rs, (r) => r.S.presence) > 0.5 && m(rs, (r) => r.S.rms || 0) > 0.003;
    const cnt = {}; for (const k of ORDER) cnt[k] = 0;
    let ink = 0, dv = 0, nsp = 0;
    for (const r of rs) for (let j = 0; j < r.P.splats.length; j++) { const p = r.P.splats[j], k = r.kinds[j] || '?'; cnt[k] = (cnt[k] || 0) + 1; nsp++; if (k !== 'drop') ink += (p.r + p.g + p.b) * (p.rad / K.RADIUS) ** 2; dv += Math.hypot(p.dx, p.dy); }
    const kicks = rs.filter((r) => r.S.kickEvt).length, snares = rs.filter((r) => r.S.snareEvt).length, chords = rs.filter((r) => r.P.chord > 0).length;
    return { s, music, cnt, ink, dv, nsp, kicks, snares, chords, hue: hsvHue(rs[rs.length - 1].P.colour) };
  });
  const mus = secs.filter((x) => x.music), ms = Math.max(1, mus.length);
  const inj = mus.filter((x) => x.nsp > 0).length;
  const chan = {}; for (const k of ORDER) chan[k] = mus.filter((x) => x.cnt[k] > 0).length;
  const hits = { kick: mus.reduce((a, x) => a + x.kicks, 0), snare: mus.reduce((a, x) => a + x.snares, 0), chord: mus.reduce((a, x) => a + x.chords, 0), hat: mus.reduce((a, x) => a + x.cnt.hat, 0) };
  const musFr = rows.filter((r) => r.S.presence > 0.5);
  const voidPct = 100 * musFr.filter((r) => r.P.params.dyeDiss < 0.5).length / Math.max(1, musFr.length);
  const deepPct = 100 * musFr.filter((r) => r.P.params.dyeDiss < 0.3).length / Math.max(1, musFr.length);
  const govA = musFr.map((r) => Math.max(1, (r.P.ink || 0) / K.INK_BUDGET)), gov = { p50: q(govA, 0.5), p90: q(govA, 0.9) };   // §111 the budget's factor on dyeDiss
  const syrupPct = 100 * musFr.filter((r) => r.P.params.velDiss > 1).length / Math.max(1, musFr.length);
  const clears = rows.filter((r) => r.clearEdge).map((r) => +r.t.toFixed(2));
  const truth = (WIN[track] && WIN[track].drops) || [], mapLines = rows.filter((r) => r.S.mapDropEvt).map((r) => r.t);
  const trueN = clears.filter((c) => truth.some((d) => Math.abs(c - d) <= 1.5) || mapLines.some((d) => Math.abs(c - d) <= 1.5)).length;
  const brk = BRK[track] ? clears.filter((c) => c >= BRK[track][0] && c <= BRK[track][1]).length : null;
  const subFr = rows.filter((r) => r.S.subGate > 0), xs = subFr.map((r) => r.xSub);
  const hitX = []; for (const r of rows) for (let j = 0; j < r.P.splats.length; j++) if (['kick', 'snare', 'chord'].includes(r.kinds[j])) hitX.push(r.P.splats[j].x);
  const kickDy = []; for (const r of rows) if (r.S.kickEvt) for (let j = 0; j < r.P.splats.length; j++) if (r.kinds[j] === 'kick') kickDy.push(r.P.splats[j].dy);
  const huePct = 100 * musFr.filter((r) => r.conf >= 0.999).length / Math.max(1, musFr.length);
  const bins = new Set(mus.map((x) => Math.floor(x.hue * 12) % 12));
  const wins = SURVEY[track] || (WIN[track] ? WIN[track].runs.flatMap((r) => r.shots.map((s) => s.t)) : []);
  const hueAt = wins.filter((t) => t <= T[N - 1]).map((t) => { const x = secs.find((y) => y.s === Math.floor(t)); return x ? Math.floor(x.hue * 12) % 12 : '—'; });
  return { track, mode, whole: tr.whole, frames: N, dur: +T[N - 1].toFixed(1), musicS: mus.length, injPct: 100 * inj / ms, chan, hits, perS: { kick: hits.kick / ms, snare: hits.snare / ms, hat: hits.hat / ms },
    ink: { p50: q(mus.map((x) => x.ink), 0.5), p90: q(mus.map((x) => x.ink), 0.9) }, gov, dv: q(mus.map((x) => x.dv), 0.5), voidPct, deepPct, syrupPct,
    clears, trueN, brk, xSub: xs.length ? { p10: q(xs, 0.1), p50: q(xs, 0.5), p90: q(xs, 0.9), span: q(xs, 0.9) - q(xs, 0.1), n: xs.length } : null,
    hitX: hitX.length ? { p10: q(hitX, 0.1), p90: q(hitX, 0.9) } : null, kickDy: kickDy.length ? { p10: q(kickDy, 0.1), p50: q(kickDy, 0.5), p90: q(kickDy, 0.9) } : null,
    huePct, hueBins: bins.size, hueAt, gate: !WIN[track] || WIN[track].gate !== false };
}

const out = [], rowsJ = [];
out.push('| track | mode | music s | inj % | sub · kick · snare · chord · hat · floor (s) | kicks · snares · hats /s | ink/s p50 / p90 (gov p50 / p90) | dv/s | void % (< .5 · < .3) | syrup % | clears (true · brk) | x sub p10/p50/p90 (span) | x hits p10/p90 | kick dy p10/p50/p90 | hue: key % · bins · at windows |');
out.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const t of TRACKS) for (const mode of MODES) {
  if (t === 'rec' && mode !== '0') continue;
  const r = row(t, mode); rowsJ.push(r);
  if (r.missing) { out.push(`| ${t} | ${mode} | — no trace (tools/traces.sh ${t}-map${mode}) |`); continue; }
  const c = r.chan, h = r.hits;
  out.push(`| ${t}${r.gate ? '' : ' (record only)'}${r.whole ? '' : ' (0–110 s)'} | ${mode} | ${r.musicS} | ${f(r.injPct, 1)} | ${c.sub} · ${c.kick} · ${c.snare} · ${c.chord} · ${c.hat} · ${c.floor} | ${f(r.perS.kick, 1)} · ${f(r.perS.snare, 1)} · ${f(r.perS.hat, 1)} | ${f(r.ink.p50, 1)} / ${f(r.ink.p90, 1)} (×${f(r.gov.p50, 1)} / ${f(r.gov.p90, 1)}) | ${f(r.dv, 1)} | ${f(r.voidPct, 0)} · ${f(r.deepPct, 0)} | ${f(r.syrupPct, 0)} | ${r.clears.length} (${r.trueN}${r.brk === null ? '' : ' · ' + r.brk}) @ ${r.clears.join(' ') || '—'} | ${r.xSub ? `${f(r.xSub.p10)}/${f(r.xSub.p50)}/${f(r.xSub.p90)} (${f(r.xSub.span)})` : '—'} | ${r.hitX ? `${f(r.hitX.p10)}/${f(r.hitX.p90)}` : '—'} | ${r.kickDy ? `${f(r.kickDy.p10)}/${f(r.kickDy.p50)}/${f(r.kickDy.p90)}` : '—'} | ${f(r.huePct, 0)} · ${r.hueBins} · ${r.hueAt.join(' ')} |`);
}
console.log(out.join('\n'));
if (process.env.JSON) fs.writeFileSync(process.env.JSON, JSON.stringify(rowsJ, (k, v) => (typeof v === 'number' && !Number.isInteger(v) ? +v.toFixed(4) : v)));
