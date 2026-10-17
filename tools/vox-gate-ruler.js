// The voice gate's ruler (DECISIONS §127; docs/plans/VOX-SCENES-PLAN.md §0's claim): how much of a track LIGHTS through
// `assets/math/vox.js` — w > 0 (the presence past the knee) and pc >= 0 (a pitch class held, the hue) — per library track,
// for BOTH sources the scenes will see: LIVE = the ears' CNN replayed over the PCM dump in node (tools/vox-ab.js's replay,
// verbatim in shape), LANE = the file-mode Demucs sidecar the page fetches. No GL, no page. The design constraint is the
// live false positive (the user listens live 90 % of the time): on a no-voice track (Comptine's solo piano, CyborgNinja,
// Vienna's synth leads) the lit share is what the knee lets through; on a voiced track it is the voice.
//   node tools/vox-gate-ruler.js                 # the eight tracks
//   node tools/vox-gate-ruler.js Comptine Vienna
//   node tools/vox-gate-ruler.js --knee=0.45,0.85   # another knee (the page's &voxk=)
// Inputs (gitignored; the one-line fix printed when one is missing): tools/work/<T>.48000.st.f32 (+ .json) and
// $MUSIC/<T>.vox.json. The gate runs at 60 fps on the stage's state at each frame (the ears publish per hop, the scene
// reads per frame); `music frames` = frames where the lane says the mix is sounding (voxConf > 0 in the lane), so a fade or
// digital silence is not counted as "dark".
import fs from 'fs';
import os from 'os';
import path from 'path';
import { VoxTrack } from '../assets/engine/ears/vox.js';
import { VOXK, mkVox, vox } from '../assets/math/vox.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const SR = 48000, FPS = 60;
const TRACKS = ['Comptine', 'CyborgNinja', 'Vienna', 'Malicious', 'WhoLikesToParty', 'IBelongHere', 'RaindropsOnRoses', 'SeeYouDrop', 'TheChain'];
const argv = process.argv.slice(2);
const flag = (k, d) => { const a = argv.find((x) => x.startsWith('--' + k + '=')); return a === undefined ? d : a.slice(k.length + 3); };
const MUSIC = path.resolve(flag('music', process.env.MUSIC || path.join(os.homedir(), 'Music/RetinaRave')));
const knee = flag('knee', ''); if (knee) { const [lo, hi] = knee.split(',').map(Number); VOXK.LO = lo; VOXK.HI = hi; }
const only = argv.filter((a) => !a.startsWith('--'));
const tracks = only.length ? only : TRACKS;
const W = (n, s) => String(s).padStart(n);

function loadMid(track) {
  const p = path.join(ROOT, 'tools/work', `${track}.${SR}.st.f32`);
  if (!fs.existsSync(p)) { console.log(`  skip ${track}: no ${path.relative(ROOT, p)} — fix: python3 tools/truth/trackmap.py ${track} --pcm --sr=${SR}`); return null; }
  const meta = JSON.parse(fs.readFileSync(p + '.json', 'utf8')), buf = fs.readFileSync(p);
  const il = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength >> 2), n = meta.n;
  const mid = new Float32Array(n);
  for (let i = 0; i < n; i++) mid[i] = 0.5 * (il[2 * i] + il[2 * i + 1]);
  return { mid, n, sr: meta.sr };
}
function loadLane(track) {
  const p = path.join(MUSIC, track + '.vox.json');
  if (!fs.existsSync(p)) { console.log(`  skip ${track}: no ${p} — fix: python3 tools/truth/voxlane.py ${track}`); return null; }
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

// the gate at 60 fps over a per-frame source (f → { voxS, voxHz, voxConf }); returns the lit shares over the music frames
function run(nFrames, at, music) {
  const st = mkVox(); let lit = 0, hue = 0, n = 0, wSum = 0, onRuns = 0, prev = 0;
  for (let f = 0; f < nFrames; f++) {
    const S = at(f);
    vox(st, 1 / FPS, S);
    if (!music(f)) { prev = 0; continue; }
    n++;
    if (st.w > 0) { lit++; wSum += st.w; if (!prev) onRuns++; }
    if (st.pc >= 0) hue++;
    prev = st.w > 0 ? 1 : 0;
  }
  return { n, lit: 100 * lit / Math.max(1, n), hue: 100 * hue / Math.max(1, n), wMean: wSum / Math.max(1, n), runs: onRuns };
}

console.log(`vox-gate-ruler · knee ${VOXK.LO} → ${VOXK.HI} · hold ${VOXK.HOLD} s · release ${VOXK.REL} s · music frames = the lane's voxConf > 0`);
console.log(`${W(17, 'track')} | ${W(7, 'frames')} | live lit % | live hue % | live w̄ | live entries | lane lit % | lane hue % | lane w̄ | lane entries`);
for (const t of tracks) {
  const pcm = loadMid(t), lane = loadLane(t);
  if (!pcm || !lane) continue;
  // the live stage: one row per hop, sampled at each frame's time (the newest hop at or before the frame)
  const vt = new VoxTrack(pcm.sr), hopT = [], hopS = [], hopHz = [], hopC = [];
  for (let i = 0; i < pcm.n; i++) if (vt.step(pcm.mid[i], (i + 1) / pcm.sr)) { hopT.push((i + 1) / pcm.sr); hopS.push(vt.s); hopHz.push(vt.hz); hopC.push(vt.conf); }
  const nFrames = Math.floor(pcm.n / pcm.sr * FPS);
  let hi = 0;
  const live = (f) => { const tt = f / FPS; while (hi + 1 < hopT.length && hopT[hi + 1] <= tt) hi++; return { voxS: hopS[hi], voxHz: hopHz[hi], voxConf: hopC[hi], key: 0, mode: 0 }; };
  const li = (f) => Math.min(lane.n - 1, Math.round(f / FPS / lane.hop));
  const laneAt = (f) => { const i = li(f); return { voxS: lane.voxS[i], voxHz: lane.voxHz[i], voxConf: lane.voxConf[i], key: 0, mode: 0 }; };
  const music = (f) => lane.voxConf[li(f)] > 0;
  hi = 0; const L = run(nFrames, live, music);
  const N = run(nFrames, laneAt, music);
  console.log(`${W(17, t)} | ${W(7, L.n)} | ${W(10, L.lit.toFixed(1))} | ${W(10, L.hue.toFixed(1))} | ${W(7, L.wMean.toFixed(3))} | ${W(12, L.runs)} | ${W(10, N.lit.toFixed(1))} | ${W(10, N.hue.toFixed(1))} | ${W(7, N.wMean.toFixed(3))} | ${W(12, N.runs)}`);
}
