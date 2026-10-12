// The vocal A/B (DECISIONS §124, the vocal detector's step 3): the LIVE CNN against the FILE-MODE lane, per library track.
// No GL, no page — the ears' stage replayed over the PCM dumps in node, read against the Demucs sidecar the page would fetch.
//
//   node tools/vox-ab.js                       # the eight library tracks, one table
//   node tools/vox-ab.js SeeYouDrop Vienna     # only those
//   node tools/vox-ab.js --music=<dir>         # where the lanes live (default $MUSIC, then ~/Music/RetinaRave)
//   node tools/vox-ab.js --lag=<ms>            # the lag search's half-window (default 500)
// Inputs (both gitignored, the one-line fix printed when one is missing): tools/work/<T>.48000.st.f32 (trackmap.py --pcm
// --sr=48000 — the same replay tools/test_vox.js uses) and $MUSIC/<T>.vox.json (tools/truth/voxlane.py).
//
// The columns:
//   sung %        frames with voxS >= VOX_GATE (.3 — the live tier's own pitch gate), lane and live
//   agree %       frames where the two agree about that: both above .3 or both below
//   pitched %     frames where BOTH publish a pitch, as a share of the frames the LANE pitches (the live tier's coverage)
//   semi %        of those, the share within 100 cents of the lane's pitch — the mix ceiling §123 measured against the
//                 stem's pYIN, here against the lane the page actually reads; `oct %` forgives an octave error
//   lag ms        the CNN's delay: the shift of the live voxS series that maximises its correlation with the lane's, over
//                 +-LAG_MS. POSITIVE = live is LATE (the ~100 ms its causal front end + the .1 s ease owe); `r` is that
//                 correlation. Measured on the lane's 10 ms grid, so the resolution is 10 ms. A cross-correlation of two
//                 series that have nothing in common has an argmax anyway (it lands on the search bound), so the lag prints
//                 as `-` below LAG_R: on a no-voice track there is no shared signal to time.
// A track with no voice anywhere (Comptine, CyborgNinja, Vienna) has nothing to agree about above the gate: its row is the
// false-positive read — the lane says nobody sings, and whatever the live column shows is the CNN's own 17-31 % (§123).
import fs from 'fs';
import os from 'os';
import path from 'path';
import { VoxTrack, VOX_GATE } from '../assets/engine/ears/vox.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const SR = 48000;
const TRACKS = ['Comptine', 'IBelongHere', 'RaindropsOnRoses', 'CyborgNinja', 'Malicious', 'SeeYouDrop', 'Vienna', 'WhoLikesToParty'];
const argv = process.argv.slice(2);
const flag = (k, d) => { const a = argv.find((x) => x.startsWith('--' + k + '=')); return a === undefined ? d : a.slice(k.length + 3); };
const MUSIC = path.resolve(flag('music', process.env.MUSIC || path.join(os.homedir(), 'Music/RetinaRave')));
const LAG_MS = +flag('lag', 500);
const LAG_R = +flag('lagr', 0.3);     // the least correlation at which a lag means anything
const only = argv.filter((a) => !a.startsWith('--'));
const tracks = only.length ? only : TRACKS;
const W = (n, s) => String(s).padStart(n);

// tools/test_vox.js' replay, verbatim in shape: the stereo dump interleaved, the mid as the ears take it.
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
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  return { j, kb: fs.statSync(p).size / 1024 };
}

// The stage over the whole track: one row per 512-sample hop, stamped at the hop's last sample (ears/vox.js step()).
function live(mid, sr) {
  const vox = new VoxTrack(sr), t = [], s = [], hz = [];
  for (let i = 0; i < mid.length; i++) if (vox.step(mid[i], (i + 1) / sr)) { t.push((i + 1) / sr); s.push(vox.s); hz.push(vox.hz); }
  return { t, s, hz };
}

// Pearson r between the lane's voxS and the live series shifted by `k` lane frames (k > 0: live read LATER lines up with the lane now).
function corrAt(laneS, liveS, k) {
  let n = 0, sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0;
  for (let i = 0; i < laneS.length; i++) {
    const j = i + k;
    if (j < 0 || j >= liveS.length) continue;
    const x = laneS[i], y = liveS[j];
    n++; sx += x; sy += y; sxx += x * x; syy += y * y; sxy += x * y;
  }
  if (n < 100) return 0;
  const cx = sxx - sx * sx / n, cy = syy - sy * sy / n;
  if (cx <= 0 || cy <= 0) return 0;
  return (sxy - sx * sy / n) / Math.sqrt(cx * cy);
}

const rows = [];
console.log('the vocal A/B: the live CNN (ears/vox.js over tools/work/<T>.48000.st.f32) against the file-mode lane (' + MUSIC + ')');
for (const track of tracks) {
  const pcm = loadMid(track); if (!pcm) continue;
  const L = loadLane(track); if (!L) continue;
  const j = L.j, hop = j.hop || 0.01, n = j.n | 0;
  const R = live(pcm.mid, pcm.sr);
  // the live series on the lane's own 10 ms grid: the NEAREST hop (10.67 ms apart at 48 kHz), the lane's rule for its own frames
  const liveS = new Float64Array(n), liveHz = new Float64Array(n).fill(-1), laneS = new Float64Array(n);
  const dt = 512 / pcm.sr;
  for (let i = 0; i < n; i++) {
    laneS[i] = j.voxS[i];
    const k = Math.round(i * hop / dt - 1);        // hop k is stamped at (k+1)·512/sr
    if (k >= 0 && k < R.s.length) { liveS[i] = R.s[k]; liveHz[i] = R.hz[k]; }
  }
  let nLane = 0, nLive = 0, agree = 0, both = 0, semi = 0, oct = 0, lanePitched = 0, cover = 0;
  for (let i = 0; i < n; i++) {
    const a = laneS[i] >= VOX_GATE, b = liveS[i] >= VOX_GATE;
    if (a) nLane++;
    if (b) nLive++;
    if (a === b) agree++;
    const ph = j.voxHz[i], pl = liveHz[i];
    if (ph > 0) lanePitched++;
    if (ph > 0 && pl > 0) {
      cover++;
      const c = 1200 * Math.log2(pl / ph);
      if (Math.abs(c) <= 100) semi++;
      if (Math.abs(((c % 1200) + 1800) % 1200 - 600) <= 100) oct++;
    }
    both += a && b ? 1 : 0;
  }
  const K = Math.round(LAG_MS / 1000 / hop);
  let bk = 0, br = -2;
  for (let k = -K; k <= K; k++) { const r = corrAt(laneS, liveS, k); if (r > br) { br = r; bk = k; } }
  rows.push({ track, n, hops: R.s.length, kb: L.kb, lane: 100 * nLane / n, live: 100 * nLive / n, agree: 100 * agree / n,
    both: 100 * both / n, lanePitched, cover: lanePitched ? 100 * cover / lanePitched : NaN,
    semi: cover ? 100 * semi / cover : NaN, oct: cover ? 100 * oct / cover : NaN, lagMs: bk * hop * 1000, r: br, r0: corrAt(laneS, liveS, 0) });
}
console.log('');
console.log('  track              frames   lane KB   sung % lane / live   agree %   both %   lane pitched   pitched %   semi %   oct %   lag ms    r (r at 0)');
for (const r of rows) console.log('  ' + r.track.padEnd(18) + W(6, r.n) + W(10, r.kb.toFixed(0)) + W(11, r.lane.toFixed(1)) + ' / ' + r.live.toFixed(1).padEnd(6)
  + W(9, r.agree.toFixed(1)) + W(9, r.both.toFixed(1)) + W(15, r.lanePitched) + W(12, isNaN(r.cover) ? '-' : r.cover.toFixed(0))
  + W(9, isNaN(r.semi) ? '-' : r.semi.toFixed(0)) + W(8, isNaN(r.oct) ? '-' : r.oct.toFixed(0)) + W(9, r.r >= LAG_R ? r.lagMs.toFixed(0) : '-') + W(9, r.r.toFixed(3)) + ' (' + r.r0.toFixed(3) + ')');
const voiced = rows.filter((r) => r.lane >= 5);
if (voiced.length) {
  const lags = voiced.filter((r) => r.r >= LAG_R).map((r) => r.lagMs).sort((a, b) => a - b);
  console.log('\n  the tracks the lane calls voiced (sung % >= 5): ' + voiced.map((r) => r.track).join(', '));
  console.log('  agreement ' + voiced.map((r) => r.agree.toFixed(0) + ' %').join(' · ')
    + (lags.length ? '   |   the CNN\'s lag median ' + lags[lags.length >> 1].toFixed(0) + ' ms (' + lags.map((x) => x.toFixed(0)).join(' / ') + ', the rows with r >= ' + LAG_R + ')' : ''));
}
