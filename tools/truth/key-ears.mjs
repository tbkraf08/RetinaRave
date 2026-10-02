// The ears' KEY, per frame, in node (NEXT-SESSION-PROMPT item 2, measurement only): a track's decoded PCM through synapse's
// Analyzer (the page's `keyConf` = A.keyClar, §62's held scale) and the causal ears (`tonic` / `tonicMinor` / `tonicConf`,
// engine/ears/tonic.js) on the deterministic file time base (tools/node-stream.js, exactly as tools/build-node.js feeds them).
// Per 60 Hz frame it also dumps the ears' own 12-bin chroma (`TonicTrack.ch`) and the gated sub note, so tools/truth/key-conf.py
// can replay every tonicConf candidate on the chroma the ears actually saw. Reads tools/work/<T>.48000.st.f32; writes
// tools/work/v84/ears-<T>.json. Engine untouched.
//   node tools/truth/key-ears.mjs [Track ...]        (default: the five)
import fs from 'node:fs';
import path from 'node:path';
import { Analyzer } from '../../assets/engine/synapse/analyzer.js';
import { Tap } from '../../assets/engine/synapse/tap.js';
import { Ears } from '../../assets/engine/ears/ears.js';
import { KK_MAJ, KK_MIN, TonicTrack, SUB_WGT } from '../../assets/engine/ears/tonic.js';
import { loadPcm } from '../test_ears.js';
import { detStream, DET_LEAD, FPS, F0 } from '../node-stream.js';

const ROOT = path.resolve(import.meta.dirname, '../..');
const OUT = path.join(ROOT, 'tools/work/v84');
fs.mkdirSync(OUT, { recursive: true });
const TRACKS = process.argv.slice(2).filter((a) => !a.startsWith('--'));
// --variant=<name>: a detector EXPERIMENT patched onto TonicTrack.prototype in this process only (the engine file is not
// touched); the output goes to ears-<T>.<variant>.json so tools/truth/key-confusion.py --suffix .<variant> grades it.
//   held    the sub leans on the chroma only while settled (subConf >= 0.8), the lean rate x conf (SUB_W is dead today:
//           blend() normalises acc by its sum, so a one-bin acc is 1 whatever SUB_W x conf was)
//   held1   held, and the sub's share of the update budget SUB_WGT 0.6 -> 1.0 (the FFT's)
const VARIANT = (process.argv.find((a) => a.startsWith('--variant=')) || '').slice(10);
if (VARIANT) {
  const wgt = VARIANT === 'held1' ? 1.0 : SUB_WGT;
  TonicTrack.prototype.subLean = function (t, sub) {
    const dt = Math.max(0, t - this.tLean); this.tLean = t;
    if (!sub || !sub.gate || sub.note < 0 || !(sub.conf >= 0.8)) return;
    const acc = this.acc; acc.fill(0);
    acc[sub.note] = 1;
    this.blend(acc, dt, wgt * Math.min(1, sub.conf));
  };
}
if (!TRACKS.length) TRACKS.push('SeeYouDrop', 'CyborgNinja', 'WhoLikesToParty', 'Malicious', 'Vienna');
const r4 = (v) => (Number.isFinite(v) ? +v.toFixed(4) : null);

for (const track of TRACKS) {
  const c0 = performance.now();
  const pcm = loadPcm(track, 48000), sr = pcm.sr;
  const tap = new Tap(); tap.an = new Analyzer(sr); tap.mute(true);
  let detMs = 0; tap.clock = () => detMs;
  const an = tap.an, A = an.A, ears = new Ears(sr);
  const t = [], key = [], mode = [], keyConf = [], tonic = [], tonicMinor = [], tonicConf = [], subNote = [], subGate = [], subConf = [];
  const ch = [];
  detStream(pcm, {
    pre(fr) { detMs = (fr + F0) * 1000 / FPS; },
    block(bl, br, mono, t0) { tap.pushBlock(mono, detMs); ears.push(bl, br, t0); },
    frame(fr, heard, dt) {
      tap.frame(dt);
      const o = ears.read(heard);
      t.push(r4(heard));
      key.push(A.key | 0); mode.push(A.mode | 0); keyConf.push(r4(A.keyClar));
      tonic.push(o.tonic | 0); tonicMinor.push(o.tonicMinor | 0); tonicConf.push(r4(o.tonicConf));
      subNote.push(o.subNote | 0); subGate.push(o.subGate ? 1 : 0); subConf.push(r4(o.subConf));
      ch.push(Array.from(ears.tone.ch, r4));
    },
  });
  const p = path.join(OUT, `ears-${track}${VARIANT ? '.' + VARIANT : ''}.json`);
  fs.writeFileSync(p, JSON.stringify({ track, sr, fps: FPS, detLead: DET_LEAD, KK_MAJ, KK_MIN,
    cols: { t, key, mode, keyConf, tonic, tonicMinor, tonicConf, subNote, subGate, subConf }, ch }));
  console.log(`${p}: ${t.length} frames · ${((performance.now() - c0) / 1000).toFixed(1)} s`);
}
