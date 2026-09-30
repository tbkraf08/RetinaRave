// The REACTIVE drums in node (2026-09-28): stream a track's decoded PCM through synapse's Analyzer (the kick / snare / hat
// levels every scene reads today) and the causal ears (engine/ears), the way the page does in deterministic file mode, and
// write a trace tools/truth/drumcheck.py grades — seconds per track instead of a 2.5 min page run.
//   python3 tools/truth/trackmap.py <Track> --pcm --sr=48000         # once per track -> tools/work/<Track>.48000.st.f32
//   node tools/drums-node.js [Track ...] [--out tools/work/drums]      # -> <out>/node-<Track>.json
//   python3 tools/truth/drumcheck.py tools/work/drums/node-*.json
// The page's det time base: the analysers see the audio DET_LEAD before it is heard, so each 1/60 s frame pushes the audio
// up to heard + DET_LEAD, decays synapse's levels by the frame (tap.js frame()), reads them, then reads the ears at heard
// time (they release an onset on the frame nearest its own audio time). The ears' `low` onsets (every 40-150 Hz onset, kick
// or bare 808 note start; ears.js drops them) are collected by wrapping perc.take() and released by the same rule.
import fs from 'node:fs';
import path from 'node:path';
import { Analyzer } from '../assets/engine/synapse/analyzer.js';
import { Ears, EARS_FIELDS } from '../assets/engine/ears/ears.js';
import { loadPcm } from './test_ears.js';
import * as D2 from '../assets/engine/drums/drums.js';
import { detStream, DET_LEAD, FPS } from './node-stream.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const a = process.argv.slice(2);
const opt = (k, d) => (a.includes(k) ? a.splice(a.indexOf(k), 2)[1] : d);
const OUT = opt('--out', path.join(ROOT, 'tools/work/drums'));
const SET = opt('--set', null);                   // --set K=v,...: drums.js DRUMS knobs (the tuning sweeps)
if (SET) for (const kv of SET.split(',')) { const [k, v] = kv.split('='); if (!(k in D2.DRUMS)) { console.error('drums-node: no DRUMS.' + k); process.exit(2); } D2.DRUMS[k] = +v; }
// --perc thrK=2.5,floor=1.0,refract=0.07,gateDb=-34: a SECOND ears instance with these low-onset thresholds feeds the low
// stream (the first keeps the page's constants for everything else) — the low picker's tuning sweep
const PERC = opt('--perc', null), PO = {};
if (PERC) for (const kv of PERC.split(',')) { const [k, v] = kv.split('='); PO[k] = +v; }
const TRACKS = a.length ? a : ['SeeYouDrop', 'CyborgNinja', 'WhoLikesToParty', 'Malicious'];
const SYN = ['kick', 'snare', 'hat'], TAU = [0.16, 0.13, 0.06];
const KEEP = ['kickEvt', 'snareEvt', 'hatEvt', 'kickAge', 'snareAge', 'hatAge', 'kickVel', 'snareVel', 'hatVel', 'subNoteEvt', 'subGate', 'subPure', 'bassReg'];

for (const track of TRACKS) {
  const pcm = loadPcm(track, 48000), sr = pcm.sr;
  const an = new Analyzer(sr), ears = new Ears(sr), drums = new D2.Drums();
  const lows = [];
  const ears2 = PERC ? new Ears(sr, { perc: { thrK: PO.thrK, gateDb: PO.gateDb, thrFloor: PO.floor !== undefined ? [PO.floor, 1.2, 1.2] : undefined,
    refract: PO.refract !== undefined ? [PO.refract, 0.060, 0.045] : undefined } }) : ears;
  const take = ears2.perc.take.bind(ears2.perc);
  ears2.perc.take = () => { const o = take(); for (const e of o) if (e.type === 'low') lows.push(e); return o; };
  const cols = { lowEvt: [], lowVel: [] };
  for (const k of [...SYN, ...KEEP, ...D2.DRUMS_OUT]) cols[k] = [];
  const t = [], f = [];
  let li = 0, cpu = 0;
  detStream(pcm, {
    block(bl, br, mono, t0) { an.push(mono); ears.push(bl, br, t0); if (ears2 !== ears) ears2.push(bl, br, t0); },
    frame(fr, heard) {
      const A = an.A, d = 1 / FPS;
      A.kick *= Math.exp(-d / TAU[0]); A.snare *= Math.exp(-d / TAU[1]); A.hat *= Math.exp(-d / TAU[2]);
      const o = ears.read(heard);
      // the ears' low onsets, released on the frame nearest their audio time (the ears' own rule: heard + half a frame)
      let low = 0, lowVel = 0, lowFl = 0;
      while (li < lows.length && lows[li].t <= heard + 0.5 / FPS) { low = 1; lowVel = Math.max(lowVel, lows[li].vel); lowFl = Math.max(lowFl, lows[li].fl); li++; }
      cols.lowEvt.push(low); cols.lowVel.push(+lowVel.toFixed(3));
      for (const k of SYN) cols[k].push(+A[k].toFixed(4));
      for (const k of KEEP) cols[k].push(typeof o[k] === 'number' ? +o[k].toFixed(4) : o[k] ? 1 : 0);
      const c0 = performance.now();
      const v = drums.step({ syn: A, ears: o, low, lowFl, bassN: an.bands.bass.n, ahead: DET_LEAD, dt: d });
      cpu += performance.now() - c0;
      for (const k of D2.DRUMS_OUT) cols[k].push(typeof v[k] === 'number' ? +v[k].toFixed(4) : v[k] ? 1 : 0);
      t.push(+heard.toFixed(6)); f.push(fr);
    },
  });
  fs.mkdirSync(OUT, { recursive: true });
  const p = path.join(OUT, `node-${track}.json`);
  fs.writeFileSync(p, JSON.stringify({ track, mode: 'node', sr, fps: FPS, detLead: DET_LEAD, t, f, fields: Object.keys(cols), cols, log: [] }));
  console.log(`${p}: ${t.length} frames · ${lows.length} low onsets · drums ${(1000 * cpu / t.length).toFixed(1)} µs/frame`);
}
