// The live build stage (engine/build, live step 4 B.2) REPLAYED on node traces (tools/build-node.js records every input the
// stage reads: v3's clock, synapse's hp / bassS / bar line, and `lowT` — the low onsets it took each frame), so a knob sweep
// runs in well under a second per track instead of re-running synapse, the ears and v3. Replay = node: the same feed(), the
// same Build (the recorded lowT were taken at the node run's --disp; the replay keeps them).
//   node tools/build-replay.js <node-trace.json> ... [--set HP_ARM=0.05,RET=1.5] [--out dir]     -> <out>/rp-<Track>.json
//   node tools/build-replay.js --sweep <node-traces...>          # each knob one step either side of the default, dropcheck'd
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { Build, BUILD } from '../assets/engine/build/build.js';
import { feed } from '../assets/engine/build/feed.js';
import { DET_LEAD } from './node-stream.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const a = process.argv.slice(2);
const opt = (k, d) => (a.includes(k) ? a.splice(a.indexOf(k), 2)[1] : d);
const flag = (k) => (a.includes(k) ? (a.splice(a.indexOf(k), 1), true) : false);
const OUT = opt('--out', path.join(ROOT, 'tools/work/build/replay'));
const SET = opt('--set', '');
const SWEEP = flag('--sweep');
const DISP = +opt('--disp', 0) / 1000;
const RULES = ['buildLive>=0.4', 'dropLiveIn<=16', 'dropLiveEvt:evt'];

export function replay(tr, knobs) {
  const k = Object.assign({}, BUILD, knobs), b = new Build(k), C = tr.cols, n = tr.t.length;
  const out = { buildLive: [], dropLiveIn: [], dropLiveEvt: [] }, S = {}, inp = {}, ts = [];
  for (let i = 0; i < n; i++) {
    S.beatCount = C.beatCount[i] - 1; S.beatPhase = C.beatPhase[i]; S.bpm = C.bpm[i]; S.presence = C.presence[i];
    S.barConf = C.barConf[i]; S.bpmSyn = C.bpmSyn[i]; S.barPos = C.barPos[i]; S.hp = C.hp[i]; S.bassS = C.bassS[i]; S.sub = C.sub[i]; S.heardT = tr.t[i];
    ts.length = 0; if (C.lowT[i]) for (const x of C.lowT[i]) ts.push(x);
    const o = b.step(feed(S, -DET_LEAD, DISP, 1 / 60, ts, inp));
    out.buildLive.push(+o.buildLive.toFixed(4)); out.dropLiveIn.push(+o.dropLiveIn.toFixed(4)); out.dropLiveEvt.push(o.dropLiveEvt ? 1 : 0);
  }
  return { track: tr.track, mode: 'replay', fps: tr.fps, t: tr.t, fields: Object.keys(out), cols: out, log: [] };
}

const parseSet = (s) => Object.fromEntries(s.split(',').filter(Boolean).map((kv) => { const [x, y] = kv.split('='); return [x, +y]; }));
const traces = a.map((p) => JSON.parse(fs.readFileSync(p, 'utf8')));
const ORDER = ['SeeYouDrop', 'WhoLikesToParty', 'Malicious', 'CyborgNinja'];
traces.sort((x, y) => ORDER.indexOf(x.track) - ORDER.indexOf(y.track));

function run(knobs, dir) {
  fs.mkdirSync(dir, { recursive: true });
  const ps = traces.map((tr) => { const p = path.join(dir, `rp-${tr.track}.json`); fs.writeFileSync(p, JSON.stringify(replay(tr, knobs))); return p; });
  const r = spawnSync('python3', [path.join(ROOT, 'tools/truth/dropcheck.py'), ...ps, '--summary', '--shifts', '50', ...RULES.flatMap((x) => ['--rule', x])], { encoding: 'utf8' });
  return r.stdout.split('\n').filter((l) => l.startsWith('`')).join('\n');
}

if (!SWEEP) console.log(run(parseSet(SET), OUT));
else {
  const STEPS = { HP_ARM: [0.05, 0.2], BASS_ARM: [0, 0.4, 0.8], MIN_HIST: [16, 48], HOLD: [0.5, 1], MAX: [4, 16], SLAM_AFTER: [0, 2], ON_BEAT: [0.0625, 0.25],
    CONF: [0.125, 0.5], RET: [1.5, 2], SUB_RET: [0, 3, 8] };
  console.log('default ' + JSON.stringify(parseSet(SET)) + '\n' + run(parseSet(SET), OUT));
  for (const kk in STEPS) for (const v of STEPS[kk]) console.log(`\n${kk}=${v}\n` + run(Object.assign(parseSet(SET), { [kk]: v }), OUT + '-sweep'));
}
