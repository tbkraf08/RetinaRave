// The REACTIVE drums in node (2026-09-28): stream a track's decoded PCM through synapse's Analyzer (the kick / snare / hat
// levels every scene reads today) and the causal ears (engine/ears), the way the page does in deterministic file mode, and
// write a trace tools/truth/drumcheck.py grades — seconds per track instead of a 2.5 min page run.
//   python3 tools/truth/trackmap.py <Track> --pcm --sr=48000         # once per track -> tools/work/<Track>.48000.st.f32
//   node tools/drums-node.js [Track ...] [--out tools/work/drums]      # -> <out>/node-<Track>.json
//   python3 tools/truth/drumcheck.py tools/work/drums/node-*.json
// The page's det time base: the analysers see the audio DET_LEAD before it is heard, so each 1/60 s frame pushes the audio
// up to heard + DET_LEAD, decays synapse's levels by the frame (tap.js frame()), reads them, then reads the ears at heard
// time (they release an onset on the frame nearest its own audio time). The ears' `low` onsets (every 60-150 Hz RISE onset, kick
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
// --perc rise=5,base=8,lag=0.012,refract=0.085,gateDb=-34: a SECOND ears instance with these LOW-lane knobs feeds the low
// stream (the first keeps the page's constants for everything else) — the low picker's tuning sweep. Since §68 the low
// lane is the 60-150 Hz RISE, so `rise` / `base` / `lag` are its knobs; since §69 the SNARE lane is the two mid bands'
// RISE and has its own — `srise` / `sbase` / `slag` / `srefract` — so `thrK` and `floor` now reach the HAT alone.
// The second instance's whole `read()` is taken when any snare knob is set, so `snareEvt` / `snareAge` / `snareVel` /
// `denS` in the trace are the swept lane's (otherwise they stay the page's, as the low sweep needs).
const PERC = opt('--perc', null), PO = {};
if (PERC) for (const kv of PERC.split(',')) { const [k, v] = kv.split('='); PO[k] = +v; }
const TRACKS = a.length ? a : ['SeeYouDrop', 'CyborgNinja', 'WhoLikesToParty', 'Malicious'];
const SYN = ['kick', 'snare', 'hat'], TAU = [0.16, 0.13, 0.06];
const KEEP = ['kickEvt', 'snareEvt', 'hatEvt', 'kickAge', 'snareAge', 'hatAge', 'kickVel', 'snareVel', 'hatVel', 'subNoteEvt', 'subGate', 'subPure', 'bassReg'];

for (const track of TRACKS) {
  const pcm = loadPcm(track, 48000), sr = pcm.sr;
  const an = new Analyzer(sr), ears = new Ears(sr), drums = new D2.Drums();
  const lows = [];
  const SPERC = PERC && (PO.srise !== undefined || PO.sbase !== undefined || PO.slag !== undefined || PO.srefract !== undefined);
  const ears2 = PERC ? new Ears(sr, { perc: { thrK: PO.thrK, gateDb: PO.gateDb,
    kickRise: PO.rise, kickBase: PO.base, kickLag: PO.lag,
    snareRise: PO.srise, snareBase: PO.sbase, snareLag: PO.slag,
    thrFloor: PO.floor !== undefined ? [PO.floor, 1.2, 1.2] : undefined,
    refract: (PO.refract !== undefined || PO.srefract !== undefined)
      ? [PO.refract === undefined ? 0.085 : PO.refract, PO.srefract === undefined ? 0.075 : PO.srefract, 0.045] : undefined } }) : ears;
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
      const o2 = ears2 !== ears ? ears2.read(heard) : null;
      const o = SPERC ? o2 : ears.read(heard);
      if (SPERC) ears.read(heard);              // the page instance is still stepped, so its own state stays honest
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
