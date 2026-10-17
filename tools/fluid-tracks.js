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
// (windows.json gate: false — the user: "can ignore malicious until I validate the ruler"); so is RaindropsOnRoses (the eighth track,
// 2026-10-10, its trace from its `start` 24 s; gate: false until the user validates a ruler on it).
// The columns (music seconds = presence > .5 and rms > .003 over the second, as the survey counted):
//   inj %        seconds with music that inject anything (the ≥ 95 % gate of test_fluid's music block)
//   sub/kick/snare/chord/hat/floor   seconds with that channel (and hits / droplets per music second)
//   ink/s        the injected ink per second, AREA-WEIGHTED (Σ dye · (rad / RADIUS)²: a kick's ×2 radius is 4× the ink of a snare's
//                at the same dye) — p50 / p90 over music seconds; the governor's budget (K.INK_BUDGET) is in these units, and
//                (gov) is its factor on dyeDiss, max(1, rate / INK_BUDGET), p50 / p90 over music frames (1.0 = never governed)
//   dv/s         Σ|dv| injected per second, p50 (uv/s)
//   void %       frames with dyeDiss < .5 · deep void % frames with dyeDiss < .3 (the latched void, §111 item 4) · syrup % frames with velDiss > 1
//   shockwaves   §113: one per confirmed clear — its second and its A (uv/s at the front: SW_K·(SW_C / beat)·g·(SW_A0 + (1 − SW_A0)·the slam's rank))
//   clears       confirmed clears (the count, then each one's second; a clear = the frame dyeDiss first reads DROP_DISS);
//                true = within 1.5 s of a truth drop (tools/truth/windows.json) or of a map bar line; brk = inside IBelongHere's
//                144–178 s breakdown (the false-arm window the survey found)
//   x sub        the sub emitter's x: p10 / p50 / p90 over the frames the gate is open, and the span p90 − p10 (0 = pinned)
//   x hits       the kick / snare / chord splats' x: p10 / p90 (the survey's "three fixed points" read .3 / .7 everywhere); (harm s · noise s)
//                the music seconds in the harmonic branch (§111 item 8: the sub shut two bars — the hits at the harmony's place) and
//                the seconds read as noise (nothing injected: applause)
//   kick dy      the kick impulse, p10 / p50 / p90 (uv/s) — the size law's room
//   hue          % of frames the pool's hue is the KEY's (the anchor's conf 1) · the hue bins (of 12) visited at 1 Hz · the hue at
//                the survey's window seconds (windows.txt) — one bin all track = one colour
//   field        §116 S1 (the band grammar only — INJECT=assets/core/fluid/inject2.js): |heave| p50 / p90 (uv/s² added to the body) and
//                |swirl| p50 / p90 (1/s²) over the music frames, and the % of music frames the field is on (|heave| + |swirl| > .01)
//   bands        §116 S2–S6 (the band grammar only): the kick's SHAPE (0 control · 1 jet · 2 stroke · 3 dipole · 4 puff), its frames (music
//                frames with a kick kind in the list), its impulse Σ dy·rad p50 / p90 over them; the snare's kind (pair · jet · harm) and
//                its frames; the mids' confinement `curl` p10 / p50 / p90 over music frames (FLUID's is 10 + 40·tension; S3's the mid band's
//                own-range place) and the mask (on / off); the highs' grain p50 / p90 (uv/s² on the velocity advect pass) and the dip's share
//                of music frames (dyeDiss × (1 − HI_SHARP) on a hat); the pen's share of music frames, its x p10 / p90 (span), its per-frame
//                step p50 / max (the §1.9 ruler: ≤ PEN_VMAX · dt); the solver's clock dtSim p10 / p50 / p90, min / max, the latched (void)
//                share, the burst frames (drop > 1), the slewed frames — every one from plan()'s return, no GL (the pixels are the strips')
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(HERE, '..');
// INJECT=<path to another inject.js> replays THAT grammar (a `git show <rev>:assets/core/fluid/inject.js > /tmp/x.js` is the before)
const { plan, mkState, FLUID_FEATS, K } = await import(process.env.INJECT ? pathToFileURL(path.resolve(process.env.INJECT)).href : '../assets/core/fluid/inject.js');
if (process.env.FLUIDK) Object.assign(K, JSON.parse(process.env.FLUIDK));
// the rulers' constants (RADIUS, INK_BUDGET, DROP_DISS) are the BASE grammar's: a composing grammar's K (inject2's K2, §116) has none of them
const KR = K.RADIUS !== undefined ? K : (await import('../assets/core/fluid/inject.js')).K;
const WIN = JSON.parse(fs.readFileSync(path.join(HERE, 'truth/windows.json'), 'utf8')).tracks;
const TRACKS = (process.env.TRACKS || 'SeeYouDrop Vienna IBelongHere CyborgNinja WhoLikesToParty Comptine Malicious RaindropsOnRoses TheChain rec').split(/\s+/).filter(Boolean);
const MODES = (process.env.MODES || '1 0').split(/\s+/).filter(Boolean);
const BRK = { IBelongHere: [144, 178] };   // the survey's false-arm window (FLUID-TRACKS §4)
const SURVEY = {};   // the survey's window seconds per track (tools/work/fluid-tracks/windows.txt when present)
try { for (const l of fs.readFileSync(path.join(ROOT, 'tools/work/fluid-tracks/windows.txt'), 'utf8').split('\n')) { const m = l.match(/^(\w+) \| (.*?) \|/); if (m) SURVEY[m[1]] = m[2].split(/\s+/).map((s) => +s.split(':')[1]); } } catch (e) { /* no survey dir: the windows.json shots instead */ }

const q = (a, p) => { if (!a.length) return NaN; const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const f = (v, d = 2) => (v == null || !isFinite(+v) ? '—' : (+v).toFixed(d));
const hsvHue = (c) => { const [r, g, b] = c; const M = Math.max(r, g, b), m = Math.min(r, g, b), d = M - m; if (d < 1e-9) return 0; let h = M === r ? ((g - b) / d) % 6 : M === g ? (b - r) / d + 2 : (r - g) / d + 4; return ((h / 6) + 1) % 1; };
const ORDER = ['sub', 'kick', 'snare', 'chord', 'hat', 'floor', 'drop'];

function traceOf(track, mode) {
  if (process.env.TRACES) { const c = path.join(path.resolve(process.env.TRACES), track + '-map' + mode + '.json'); if (fs.existsSync(c)) return { file: c, whole: true }; }   // TRACES=<dir>: whole-track traces recorded elsewhere, <Track>-map{1,0}.json
  const a = path.join(ROOT, 'tools/work/fluid-tracks', track, 'trace-map' + mode + '.json'), b = path.join(ROOT, 'tools/truth/traces', track + '-map' + mode + '.json');
  if (track !== 'rec' && fs.existsSync(a)) return { file: a, whole: true };
  if (fs.existsSync(b)) return { file: b, whole: false };
  return null;
}

function row(track, mode) {
  const tr = traceOf(track, mode);
  if (!tr) return { track, mode, missing: true };
  const J = JSON.parse(fs.readFileSync(tr.file, 'utf8')), C = J.cols, T = J.t, N = J.f.length;
  const lacks = FLUID_FEATS.filter((k) => !(k in C) && k !== 'seed');   // a trace without a field the grammar reads: that field is 0 here (said in the row — §116 S1: the whole-track traces predate `sub`)
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
    const clear = P.params.dyeDiss >= KR.DROP_DISS ? 1 : 0;
    const b = st.base || st;   // §116: a band-grammar state (INJECT=inject2.js) carries the base's xSub / anchor in .base
    rows.push({ t: +T[i], S, P, kinds, xSub: b.xSub, clearEdge: clear && !dropsPrev ? 1 : 0, conf: b.anchor.OUT.conf, wave: P.ring && P.drop === 1 ? +P.ring.a.toFixed(2) : 0 });   // §113: the shockwave's A on the frame it fires
    dropsPrev = clear;
  }
  const by = new Map(); for (const r of rows) { const s = Math.floor(r.t); if (!by.has(s)) by.set(s, []); by.get(s).push(r); }
  const m = (rs, fn) => rs.reduce((a, r) => a + fn(r), 0) / rs.length;
  const secs = [...by.entries()].sort((a, b) => a[0] - b[0]).map(([s, rs]) => {
    const music = m(rs, (r) => r.S.presence) > 0.5 && m(rs, (r) => r.S.rms || 0) > 0.003;
    const cnt = {}; for (const k of ORDER) cnt[k] = 0;
    let ink = 0, dv = 0, nsp = 0;
    for (const r of rs) for (let j = 0; j < r.P.splats.length; j++) { const p = r.P.splats[j], k = r.kinds[j] || '?'; cnt[k] = (cnt[k] || 0) + 1; nsp++; if (k !== 'drop') ink += (p.r + p.g + p.b) * (p.rad / KR.RADIUS) ** 2; dv += Math.hypot(p.dx, p.dy); }
    const kicks = rs.filter((r) => r.S.kickEvt).length, snares = rs.filter((r) => r.S.snareEvt).length, chords = rs.filter((r) => r.P.chord > 0).length;
    return { s, music, cnt, ink, dv, nsp, kicks, snares, chords, hue: hsvHue(rs[rs.length - 1].P.colour), harm: m(rs, (r) => r.P.harmonic || 0) > 0.5, noise: m(rs, (r) => r.P.noise || 0) > 0.5 };
  });
  const mus = secs.filter((x) => x.music), ms = Math.max(1, mus.length);
  const inj = mus.filter((x) => x.nsp > 0).length;
  const chan = {}; for (const k of ORDER) chan[k] = mus.filter((x) => x.cnt[k] > 0).length;
  const hits = { kick: mus.reduce((a, x) => a + x.kicks, 0), snare: mus.reduce((a, x) => a + x.snares, 0), chord: mus.reduce((a, x) => a + x.chords, 0), hat: mus.reduce((a, x) => a + x.cnt.hat, 0) };
  const musFr = rows.filter((r) => r.S.presence > 0.5);
  const voidPct = 100 * musFr.filter((r) => r.P.params.dyeDiss < 0.5).length / Math.max(1, musFr.length);
  const deepPct = 100 * musFr.filter((r) => r.P.params.dyeDiss < 0.3).length / Math.max(1, musFr.length);
  const govA = musFr.map((r) => Math.max(1, (r.P.ink || 0) / KR.INK_BUDGET)), gov = { p50: q(govA, 0.5), p90: q(govA, 0.9) };   // §111 the budget's factor on dyeDiss
  const syrupPct = 100 * musFr.filter((r) => r.P.params.velDiss > 1).length / Math.max(1, musFr.length);
  const clears = rows.filter((r) => r.clearEdge).map((r) => +r.t.toFixed(2));
  const waves = rows.filter((r) => r.wave > 0).map((r) => ({ t: +r.t.toFixed(2), a: r.wave }));   // §113: one shockwave per confirmed clear, its A (uv/s at the front)
  const truth = (WIN[track] && WIN[track].drops) || [], mapLines = rows.filter((r) => r.S.mapDropEvt).map((r) => r.t);
  const trueN = clears.filter((c) => truth.some((d) => Math.abs(c - d) <= 1.5) || mapLines.some((d) => Math.abs(c - d) <= 1.5)).length;
  const brk = BRK[track] ? clears.filter((c) => c >= BRK[track][0] && c <= BRK[track][1]).length : null;
  const subFr = rows.filter((r) => r.S.subGate > 0), xs = subFr.map((r) => r.xSub);
  const hitX = []; for (const r of rows) for (let j = 0; j < r.P.splats.length; j++) if (['kick', 'snare', 'chord'].includes(r.kinds[j])) hitX.push(r.P.splats[j].x);
  const harmS = secs.filter((x) => x.music && x.harm).length, noiseS = secs.filter((x) => x.noise).length;   // §111 item 8
  const kickDy = []; for (const r of rows) if (r.S.kickEvt) for (let j = 0; j < r.P.splats.length; j++) if (r.kinds[j] === 'kick') kickDy.push(r.P.splats[j].dy);
  const huePct = 100 * musFr.filter((r) => r.conf >= 0.999).length / Math.max(1, musFr.length);
  const field = rows.length && rows[0].P.heave !== undefined ? { heave: { p50: q(musFr.map((r) => Math.abs(r.P.heave)), 0.5), p90: q(musFr.map((r) => Math.abs(r.P.heave)), 0.9) }, swirl: { p50: q(musFr.map((r) => Math.abs(r.P.swirl)), 0.5), p90: q(musFr.map((r) => Math.abs(r.P.swirl)), 0.9) }, onPct: 100 * musFr.filter((r) => Math.abs(r.P.heave) + Math.abs(r.P.swirl) > 0.01).length / Math.max(1, musFr.length) } : null;   // §116 S1 the band grammar's field
  let bands = null;   // §116 S2–S6: the band grammar's per-frame records (kick / snare / mids / highs / pen / time), summarised per track
  if (rows.length && rows[0].P.kick !== undefined) {
    const kf = musFr.filter((r) => r.P.kick && r.P.kick.n > 0), sf = musFr.filter((r) => r.P.snare && r.P.snare.n > 0), pf = musFr.filter((r) => r.P.pen && r.P.pen.on);
    const tm = musFr.map((r) => r.P.time || { dtSim: 1, latched: 0, drop: 1, slewed: 0 }), dts = tm.map((t) => t.dtSim);
    bands = { kick: { shape: rows[0].P.kick.shape, frames: kf.length, mom: { p50: q(kf.map((r) => r.P.kick.mom), 0.5), p90: q(kf.map((r) => r.P.kick.mom), 0.9) } },
      snare: { kind: (sf.find((r) => r.P.snare.kind) || { P: { snare: { kind: '—' } } }).P.snare.kind, frames: sf.length },
      curl: { p10: q(musFr.map((r) => r.P.params.curl), 0.1), p50: q(musFr.map((r) => r.P.params.curl), 0.5), p90: q(musFr.map((r) => r.P.params.curl), 0.9), mask: musFr.some((r) => r.P.mids && r.P.mids.mask) ? 'on' : 'off' },
      grain: { p50: q(musFr.map((r) => r.P.grain || 0), 0.5), p90: q(musFr.map((r) => r.P.grain || 0), 0.9), dipPct: 100 * musFr.filter((r) => r.P.highs && r.P.highs.dip < 1).length / Math.max(1, musFr.length) },
      pen: { onPct: 100 * pf.length / Math.max(1, musFr.length), x: pf.length ? { p10: q(pf.map((r) => r.P.pen.x), 0.1), p90: q(pf.map((r) => r.P.pen.x), 0.9) } : null, step: pf.length ? { p50: q(pf.map((r) => r.P.pen.step), 0.5), max: Math.max(...pf.map((r) => r.P.pen.step)) } : null },
      dt: { p10: q(dts, 0.1), p50: q(dts, 0.5), p90: q(dts, 0.9), min: Math.min(...dts), max: Math.max(...dts), latchedPct: 100 * tm.filter((t) => t.latched).length / Math.max(1, tm.length), burst: tm.filter((t) => t.drop > 1).length, slewed: tm.filter((t) => t.slewed).length } };
  }
  const bins = new Set(mus.map((x) => Math.floor(x.hue * 12) % 12));
  const wins = SURVEY[track] || (WIN[track] ? WIN[track].runs.flatMap((r) => r.shots.map((s) => s.t)) : []);
  const hueAt = wins.filter((t) => t <= T[N - 1]).map((t) => { const x = secs.find((y) => y.s === Math.floor(t)); return x ? Math.floor(x.hue * 12) % 12 : '—'; });
  return { track, mode, whole: tr.whole, frames: N, dur: +T[N - 1].toFixed(1), musicS: mus.length, injPct: 100 * inj / ms, chan, hits, perS: { kick: hits.kick / ms, snare: hits.snare / ms, hat: hits.hat / ms },
    ink: { p50: q(mus.map((x) => x.ink), 0.5), p90: q(mus.map((x) => x.ink), 0.9) }, gov, dv: q(mus.map((x) => x.dv), 0.5), voidPct, deepPct, syrupPct,
    clears, trueN, brk, waves, xSub: xs.length ? { p10: q(xs, 0.1), p50: q(xs, 0.5), p90: q(xs, 0.9), span: q(xs, 0.9) - q(xs, 0.1), n: xs.length } : null,
    hitX: hitX.length ? { p10: q(hitX, 0.1), p90: q(hitX, 0.9) } : null, harmS, noiseS, kickDy: kickDy.length ? { p10: q(kickDy, 0.1), p50: q(kickDy, 0.5), p90: q(kickDy, 0.9) } : null,
    huePct, hueBins: bins.size, hueAt, field, bands, lacks, gate: !WIN[track] || WIN[track].gate !== false };
}

const out = [], rowsJ = [];
out.push('| track | mode | music s | inj % | sub · kick · snare · chord · hat · floor (s) | kicks · snares · hats /s | ink/s p50 / p90 (gov p50 / p90) | dv/s | void % (< .5 · < .3) | syrup % | clears (true · brk) | shockwaves @ s · A | x sub p10/p50/p90 (span) | x hits p10/p90 (harm s · noise s) | kick dy p10/p50/p90 | hue: key % · bins · at windows | field: |heave| p50/p90 · |swirl| p50/p90 · on % | bands: kick shape · frames · mom p50/p90 · snare kind · frames · curl p10/p50/p90 · mask · grain p50/p90 · dip % · pen % · x p10/p90 (span) · step p50/max · dtSim p10/p50/p90 · min/max · latched % · burst · slewed |');
out.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const t of TRACKS) for (const mode of MODES) {
  if (t === 'rec' && mode !== '0') continue;
  const r = row(t, mode); rowsJ.push(r);
  if (r.missing) { out.push(`| ${t} | ${mode} | — no trace (tools/traces.sh ${t}-map${mode}) |`); continue; }
  const c = r.chan, h = r.hits;
  out.push(`| ${t}${r.gate ? '' : ' (record only)'}${r.whole ? '' : ' (0–110 s)'}${r.lacks.length ? ' (trace lacks ' + r.lacks.join(',') + ')' : ''} | ${mode} | ${r.musicS} | ${f(r.injPct, 1)} | ${c.sub} · ${c.kick} · ${c.snare} · ${c.chord} · ${c.hat} · ${c.floor} | ${f(r.perS.kick, 1)} · ${f(r.perS.snare, 1)} · ${f(r.perS.hat, 1)} | ${f(r.ink.p50, 1)} / ${f(r.ink.p90, 1)} (×${f(r.gov.p50, 1)} / ${f(r.gov.p90, 1)}) | ${f(r.dv, 1)} | ${f(r.voidPct, 0)} · ${f(r.deepPct, 0)} | ${f(r.syrupPct, 0)} | ${r.clears.length} (${r.trueN}${r.brk === null ? '' : ' · ' + r.brk}) @ ${r.clears.join(' ') || '—'} | ${r.waves.length} @ ${r.waves.map((w) => w.t + '·' + w.a).join(' ') || '—'} | ${r.xSub ? `${f(r.xSub.p10)}/${f(r.xSub.p50)}/${f(r.xSub.p90)} (${f(r.xSub.span)})` : '—'} | ${r.hitX ? `${f(r.hitX.p10)}/${f(r.hitX.p90)}` : '—'} (${r.harmS} · ${r.noiseS}) | ${r.kickDy ? `${f(r.kickDy.p10)}/${f(r.kickDy.p50)}/${f(r.kickDy.p90)}` : '—'} | ${f(r.huePct, 0)} · ${r.hueBins} · ${r.hueAt.join(' ')} | ${r.field ? `${f(r.field.heave.p50, 3)}/${f(r.field.heave.p90, 3)} · ${f(r.field.swirl.p50, 3)}/${f(r.field.swirl.p90, 3)} · ${f(r.field.onPct, 0)}` : '—'} | ${r.bands ? `${r.bands.kick.shape} · ${r.bands.kick.frames} · ${f(r.bands.kick.mom.p50, 3)}/${f(r.bands.kick.mom.p90, 3)} · ${r.bands.snare.kind} · ${r.bands.snare.frames} · ${f(r.bands.curl.p10, 0)}/${f(r.bands.curl.p50, 0)}/${f(r.bands.curl.p90, 0)} · ${r.bands.curl.mask} · ${f(r.bands.grain.p50, 3)}/${f(r.bands.grain.p90, 3)} · ${f(r.bands.grain.dipPct, 0)} · ${f(r.bands.pen.onPct, 0)} · ${r.bands.pen.x ? `${f(r.bands.pen.x.p10)}/${f(r.bands.pen.x.p90)} (${f(r.bands.pen.x.p90 - r.bands.pen.x.p10)})` : '—'} · ${r.bands.pen.step ? `${f(r.bands.pen.step.p50, 4)}/${f(r.bands.pen.step.max, 4)}` : '—'} · ${f(r.bands.dt.p10, 3)}/${f(r.bands.dt.p50, 3)}/${f(r.bands.dt.p90, 3)} · ${f(r.bands.dt.min, 3)}/${f(r.bands.dt.max, 3)} · ${f(r.bands.dt.latchedPct, 0)} · ${r.bands.dt.burst} · ${r.bands.dt.slewed}` : '—'} |`);
}
console.log(out.join('\n'));
if (process.env.JSON) fs.writeFileSync(process.env.JSON, JSON.stringify(rowsJ, (k, v) => (typeof v === 'number' && !Number.isInteger(v) ? +v.toFixed(4) : v)));
