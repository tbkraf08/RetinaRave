// The BUILD / DROP candidates in node (live step 4 B.1): a track's decoded PCM through the page's three live analysers on the
// deterministic file time base (tools/node-stream.js — drums-node's, shared): synapse's Analyzer behind its own Tap (frame()
// decays, beat-clock lead, as features-synapse.js calls it), the causal ears (engine/ears, `&map=0`), and v3's extractor
// (features.js updateMusic on the det analyser shims). One whole track in ~10 s instead of a 3-4 min page run; the trace is
// the page trace's format, so tools/truth/dropcheck.py grades both and tools/truth/buildstudy.py reads it.
//   python3 tools/truth/trackmap.py <Track> --pcm --sr=48000      # once per track -> tools/work/<Track>.48000.st.f32
//   node tools/build-node.js [Track ...] [--out tools/work/build] [--no-v3]   # -> <out>/node-<Track>.json
//   python3 tools/truth/dropcheck.py tools/work/build/node-*.json
//   python3 tools/truth/buildstudy.py tools/work/build/node-*.json [--md out.md]
//   node tools/build-node.js --cmp <page-trace.json> <node-trace.json> [fields]   # page = node, per field
// Names: synapse's own tension is `synTension` (MS.tension is v3's roughness), its drop / fake-out events `synDropEvt` /
// `synFakeoutEvt` (anatomy.js pushes them; features-synapse.js does not publish a drop), ev.all = `synAll`, the smoothed
// evidence `synEvS`; `rollRate` = log2 kick/snare onsets per s (anatomy's roll input), `kickGap` = s since synapse's last kick.
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { Analyzer } from '../assets/engine/synapse/analyzer.js';
import { Tap } from '../assets/engine/synapse/tap.js';
import { Ears } from '../assets/engine/ears/ears.js';
import { loadPcm } from './test_ears.js';
import { detStream, makeV3, DET_LEAD, FPS, F0 } from './node-stream.js';
import { Build, BUILD, BUILD_OUT } from '../assets/engine/build/build.js';
import { feed, laneTake } from '../assets/engine/build/feed.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const a = process.argv.slice(2);

if (a[0] === '--cmp') {   // page = node: per field, frames compared at equal heard time
  const P = JSON.parse(fs.readFileSync(a[1], 'utf8')), N = JSON.parse(fs.readFileSync(a[2], 'utf8'));
  const idx = new Map(N.t.map((t, i) => [Math.round(t * FPS), i]));
  const fields = (a[3] || 'riser,dropConf,dropExpectedIn,hush,denK,denS,denH,subGate,lpSweep,width,build,eS,eM,dropEvt,bpm,beatCount,tension').split(',');
  for (const k of fields) {
    const pc = P.cols[k], nc = N.cols[k === 'tension' ? 'tension' : k];
    if (!pc || !nc) { console.log(`${k.padEnd(15)} absent (${!pc ? 'page' : 'node'})`); continue; }
    let n = 0, same = 0, mx = 0, sumd = 0;
    for (let i = 0; i < P.t.length; i++) {
      const j = idx.get(Math.round(P.t[i] * FPS)); if (j === undefined) continue;
      const x = pc[i] === null ? NaN : +pc[i], y = nc[j] === null ? NaN : +nc[j];
      n++; const d = Math.abs(x - y); if (d <= 1e-3 || (isNaN(x) && isNaN(y))) same++; if (d > mx) mx = d; if (!isNaN(d)) sumd += d;
    }
    console.log(`${k.padEnd(15)} ${same}/${n} frames within 1e-3 · max |diff| ${mx.toPrecision(3)} · mean ${(sumd / Math.max(1, n)).toPrecision(3)}`);
  }
  process.exit(0);
}

const opt = (k, d) => (a.includes(k) ? a.splice(a.indexOf(k), 2)[1] : d);
const flag = (k) => (a.includes(k) ? (a.splice(a.indexOf(k), 1), true) : false);
const OUT = opt('--out', path.join(ROOT, 'tools/work/build'));
const V3 = !flag('--no-v3');
// the live build stage (engine/build, B.2) runs with v3: --disp <ms> its display lead (0 = the &lead=0 page, 40 = the default
// file page); BUILDK='{"HP_ARM":0.05}' overrides knobs (the sweep uses tools/build-replay.js on the recorded inputs instead)
const DISP = +opt('--disp', 0) / 1000;
if (process.env.BUILDK) Object.assign(BUILD, JSON.parse(process.env.BUILDK));
const TRACKS = a.length ? a : ['SeeYouDrop', 'CyborgNinja', 'WhoLikesToParty', 'Malicious'];

const EARS_K = ['denK', 'denS', 'denH', 'subGate', 'subIn', 'subOut', 'subPure', 'subConf', 'bassReg', 'lpSweep', 'width', 'pulse', 'kickEvt', 'snareEvt', 'hatEvt', 'kickAge', 'kickVel'];
const SYN_A = { synTension: 'tension', hush: 'hush', dropConf: 'dropConf', dropExpectedIn: 'dropExpectedIn', gridTrust: 'gridTrust',
  phraseConf: 'phraseConf', barConf: 'barConf', beatConf: 'beatConf', beatSyn: 'beat', bpmSyn: 'bpm', eFast: 'eFast', eShort: 'eShort',
  eMed: 'eMed', eLong: 'eLong', bassS: 'bassS', midS: 'midS', highS: 'highS', sub: 'sub', lvl: 'level', centroid: 'centroid',
  calm: 'calm', alive: 'alive', resolve: 'resolve', novelty: 'novelty', foote: 'foote', flux: 'flux', kick: 'kick', snare: 'snare', hat: 'hat' };
const SYN_EV = { riser: 'riser', roll: 'roll', hp: 'hp', swell: 'swell', gap: 'gap', synAll: 'all' };
const SYN_IN = { synEvS: 'evS', kickGap: 'kickGap', bShort: 'bShort', bLong: 'bLong', dens: 'dens', densSlow: 'densSlow' };
const V3_K = ['build', 'buildPk', 'dropEvt', 'dropEnv', 'eS', 'eM', 'eL', 'absentT', 'onsetRate', 'tension', 'bpm', 'beatCount', 'beatPhase',
  'presence', 'bass', 'high', 'highM', 'arcN'];
const ARC = { idle: 0, valley: 1, sustain: 2, build: 3, peak: 4 };
const r4 = (v) => (typeof v === 'boolean' ? (v ? 1 : 0) : Number.isFinite(v) ? +v.toFixed(4) : null);

// v3's state is the engine's module singleton (MS / XS): one process per track, or the second track starts warm on the first
if (V3 && TRACKS.length > 1) {
  for (const tr of TRACKS) {
    const r = spawnSync('node', [import.meta.filename, tr, '--out', OUT, '--disp', String(DISP * 1000)], { stdio: 'inherit' });
    if (r.status) process.exit(r.status);
  }
  process.exit(0);
}

for (const track of TRACKS) {
  const c0 = performance.now();
  const pcm = loadPcm(track, 48000), sr = pcm.sr;
  const tap = new Tap(); tap.an = new Analyzer(sr); tap.mute(true);
  let detMs = 0; tap.clock = () => detMs;
  const an = tap.an, A = an.A, ears = new Ears(sr), v3 = V3 ? await makeV3(pcm) : null;
  const names = [...EARS_K, ...Object.keys(SYN_A), ...Object.keys(SYN_EV), ...Object.keys(SYN_IN), 'rollRate', 'phrase16Pos', 'barPos',
    'synDropEvt', 'synFakeoutEvt', 'synBoundaryEvt', 'lowEvt', 'lowFl', 'lowAge', ...(V3 ? [...V3_K, ...BUILD_OUT, 'lowT'] : [])];
  const cols = Object.fromEntries(names.map((k) => [k, []]));
  const t = [], f = [];
  const bst = { b: new Build(), lane: { t: -Infinity }, ts: [], inp: {}, S: {} };
  const wrap = (x, n) => ((x % n) + n) % n;
  detStream(pcm, {
    pre(fr) { detMs = (fr + F0) * 1000 / FPS; },   // file.js tickFile: the frame clock's ms, then this frame's pushes
    block(bl, br, mono, t0) { tap.pushBlock(mono, detMs); ears.push(bl, br, t0); },
    frame(fr, heard, dt) {
      if (v3) { const S = v3.step(fr, heard, dt); for (const k of V3_K) cols[k].push(r4(k === 'arcN' ? ARC[S.arc] ?? -1 : S[k])); }
      tap.frame(dt);
      const o = ears.read(heard);
      for (const k of EARS_K) cols[k].push(r4(o[k]));
      // the LOW lane (engine/drums' kick; engine/build's slam): an onset released this frame, its raw flux and age (heard)
      let lf = 0, la = 99;
      for (const e of ears.lowReleased) { if (e.fl > lf) lf = e.fl; la = heard - e.t; }
      cols.lowEvt.push(ears.lowReleased.length ? 1 : 0); cols.lowFl.push(r4(lf)); cols.lowAge.push(r4(la));
      if (v3) {   // the build stage, fed as features-build.js feeds it (v3's count - 1: the page's, B.1)
        const M = v3.MS, S = bst.S;
        S.beatCount = M.beatCount - 1; S.beatPhase = M.beatPhase; S.bpm = M.bpm; S.presence = M.presence;
        S.barConf = A.barConf; S.bpmSyn = A.bpm; S.barPos = wrap(A.beat - an.o4, 4); S.hp = A.ev.hp; S.bassS = A.bassS; S.sub = A.sub; S.heardT = heard;
        const ts = laneTake(ears, heard + DISP + 0.5 / FPS, bst.lane, bst.ts);
        cols.lowT.push(ts.length ? ts.map((x) => +x.toFixed(6)) : null);
        const bo = bst.b.step(feed(S, -DET_LEAD, DISP, dt, ts, bst.inp));
        for (const k of BUILD_OUT) cols[k].push(r4(bo[k]));
      }
      for (const k in SYN_A) cols[k].push(r4(A[SYN_A[k]]));
      for (const k in SYN_EV) cols[k].push(r4(A.ev[SYN_EV[k]]));
      for (const k in SYN_IN) cols[k].push(r4(an[SYN_IN[k]]));
      cols.rollRate.push(r4(an.rollHist[0]));
      cols.phrase16Pos.push(r4(wrap(A.beat - an.o16, 16))); cols.barPos.push(r4(wrap(A.beat - an.o4, 4)));
      let dr = 0, fk = 0, bd = 0;
      for (const e of A.events) { if (e.type === 'drop') dr = 1; else if (e.type === 'fakeout') fk = 1; else if (e.type === 'boundary') bd = 1; }
      A.events.length = 0;
      cols.synDropEvt.push(dr); cols.synFakeoutEvt.push(fk); cols.synBoundaryEvt.push(bd);
      t.push(+heard.toFixed(6)); f.push(fr + F0);
    },
  });
  fs.mkdirSync(OUT, { recursive: true });
  const p = path.join(OUT, `node-${track}.json`);
  fs.writeFileSync(p, JSON.stringify({ track, mode: 'node', sr, at: 0, fps: FPS, detLead: DET_LEAD, fields: names, f, t, cols, log: [] }));
  console.log(`${p}: ${t.length} frames · ${names.length} fields · ${((performance.now() - c0) / 1000).toFixed(1)} s`);
}
