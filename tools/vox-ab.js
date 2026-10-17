// The vocal A/B (DECISIONS §124, the vocal detector's step 3): the LIVE CNN against the FILE-MODE lane, per library track.
// No GL, no page — the ears' stage replayed over the PCM dumps in node, read against the Demucs sidecar the page would fetch.
//
//   node tools/vox-ab.js                       # the eight library tracks, one table
//   node tools/vox-ab.js SeeYouDrop Vienna     # only those
//   node tools/vox-ab.js --music=<dir>         # where the lanes live (default $MUSIC, then ~/Music/RetinaRave)
//   node tools/vox-ab.js --lag=<ms>            # the lag search's half-window (default 500)
//   node tools/vox-ab.js --stage=raw|held|eased|all   # §126: which stage of the live tier the lag column times (default all: a second
//                                              table with the three lags per track, and the differences between them)
//   node tools/vox-ab.js --ease=.03,.05,4,3    # §133: the stage's attack s, release s, vote window hops, votes needed — the ease sweep (default: vox.js's constants)
//   node tools/vox-ab.js --stamp=end|centre    # §126: where a hop is stamped on the lane's grid — the END of its 2048-sample frame (what
//                                              the display sees; the default) or the frame's CENTROID 21 ms earlier (the lane's own
//                                              convention: the lag printed is then the net's commit + the hold + the ease, the frame's
//                                              width taken out; the ruler's grid only — the engine publishes nothing earlier)
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
//
// THE STAGES (§126, the lag budget measured instead of estimated — VOX-CNN2-PLAN item 2): the live tier is three series, each later
// than the one before: (a) RAW — the net's output at the hop it fired (one inference per 4 hops, so the series exists on a quarter of
// the grid and the correlation runs on those frames alone); (b) HELD — the same value sample-and-held over the hops until the next
// inference (the `p` the ease chases); (c) EASED — `voxS`, what the rig reads. (b) − (a) is the hold's cost, (c) − (b) the ease's,
// and (a) is the frame's centroid plus the net's own commit on a boundary. The second table prints the three lags, the two
// differences, FLICKER (crossings of the .3 gate per minute, lane and live — a shorter ease is paid for in the open) and the
// RUN-LENGTH histogram of the live tier's voiced runs (frames ≥ .3 in a row: ≤ 50 ms is a spike a hysteresis kills, ≥ 1 s a
// passage). The lag is a cross-correlation argmax on a 10 ms grid: ±10 ms is the resolution, not a finding.
// §133: the net outputs EVERY hop, so (a) and (b) are the same series and the `hold` column reads 0 — the hold's 20–30 ms is simply
// gone from the budget; `semi %` now reads the pitch HEAD (refined by salience) against the lane instead of the YIN on the mix.
import fs from 'fs';
import os from 'os';
import path from 'path';
import { VoxTrack, VOX_GATE } from '../assets/engine/ears/vox.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const SR = 48000;
const TRACKS = ['Comptine', 'IBelongHere', 'RaindropsOnRoses', 'CyborgNinja', 'Malicious', 'SeeYouDrop', 'Vienna', 'WhoLikesToParty', 'TheChain'];
const argv = process.argv.slice(2);
const flag = (k, d) => { const a = argv.find((x) => x.startsWith('--' + k + '=')); return a === undefined ? d : a.slice(k.length + 3); };
const MUSIC = path.resolve(flag('music', process.env.MUSIC || path.join(os.homedir(), 'Music/RetinaRave')));
const LAG_MS = +flag('lag', 500);
const LAG_R = +flag('lagr', 0.3);     // the least correlation at which a lag means anything
const STAGE = flag('stage', 'all');   // raw | held | eased | all (§126)
const STAMP = flag('stamp', 'end');   // end | centre (§126): where a hop sits on the lane's grid
const EASE = flag('ease', '');        // §133: attack,release,voteOf,voteOn (s, s, hops, hops) — the stage's ease overridden for the sweep; '' = vox.js's constants
const EASE_O = EASE ? (([a, r, of, on]) => ({ attack: +a, release: +r, voteOf: +of, voteOn: +on }))(EASE.split(',')) : {};
const RUN_BINS = [50, 100, 250, 500, 1000];   // ms: the run-length histogram's upper edges (the last bin is "longer")
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
// §126: beside `s` (the eased voxS) the HELD net output `p` and the RAW output on the hops an inference fired (NaN elsewhere).
function live(mid, sr) {
  const vox = new VoxTrack(sr, EASE_O), t = [], s = [], hz = [], held = [], raw = [];
  let fired = 0;
  for (let i = 0; i < mid.length; i++) if (vox.step(mid[i], (i + 1) / sr)) {
    t.push((i + 1) / sr); s.push(vox.s); hz.push(vox.hz); held.push(vox.p);
    raw.push(vox.fired > fired ? vox.p : NaN); fired = vox.fired;
  }
  return { t, s, hz, held, raw };
}

// Pearson r between the lane's voxS and the live series shifted by `k` lane frames (k > 0: live read LATER lines up with the lane now).
function corrAt(laneS, liveS, k) {
  let n = 0, sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0;
  for (let i = 0; i < laneS.length; i++) {
    const j = i + k;
    if (j < 0 || j >= liveS.length) continue;
    const x = laneS[i], y = liveS[j];
    if (y !== y) continue;                       // NaN: the raw stage has no value on this frame
    n++; sx += x; sy += y; sxx += x * x; syy += y * y; sxy += x * y;
  }
  if (n < 100) return 0;
  const cx = sxx - sx * sx / n, cy = syy - sy * sy / n;
  if (cx <= 0 || cy <= 0) return 0;
  return (sxy - sx * sy / n) / Math.sqrt(cx * cy);
}

// The lag that maximises the correlation of the lane with a live series over ±K frames, and that correlation.
function bestLag(laneS, liveS, K) {
  let bk = 0, br = -2;
  for (let k = -K; k <= K; k++) { const r = corrAt(laneS, liveS, k); if (r > br) { br = r; bk = k; } }
  return { k: bk, r: br };
}
// Crossings of the gate per minute (a series on the 10 ms grid; NaN frames hold the last state).
function flicker(S, hop) {
  let on = false, cross = 0, first = true;
  for (let i = 0; i < S.length; i++) {
    const v = S[i]; if (v !== v) continue;
    const b = v >= VOX_GATE;
    if (!first && b !== on) cross++;
    on = b; first = false;
  }
  return cross / (S.length * hop / 60);
}
// The run-length histogram of the voiced runs (frames ≥ the gate in a row), in ms, binned by RUN_BINS (the last bin: longer).
function runs(S, hop) {
  const h = new Array(RUN_BINS.length + 1).fill(0); let run = 0, n = 0;
  const close = () => { if (!run) return; const ms = run * hop * 1000; let b = RUN_BINS.findIndex((e) => ms <= e); if (b < 0) b = RUN_BINS.length; h[b]++; n++; run = 0; };
  for (let i = 0; i < S.length; i++) { if (S[i] >= VOX_GATE) run++; else close(); }
  close();
  return { h, n };
}
const runLine = (R) => String(R.n).padStart(4) + ' runs: ' + RUN_BINS.map((e, i) => '≤' + (e >= 1000 ? (e / 1000) + 's' : e) + ' ' + String(R.h[i]).padStart(3)).join(' · ') + ' · >' + (RUN_BINS[RUN_BINS.length - 1] / 1000) + 's ' + String(R.h[RUN_BINS.length]).padStart(3);

const rows = [];
console.log('the vocal A/B: the live CNN (ears/vox.js over tools/work/<T>.48000.st.f32) against the file-mode lane (' + MUSIC + ')');
for (const track of tracks) {
  const pcm = loadMid(track); if (!pcm) continue;
  const L = loadLane(track); if (!L) continue;
  const j = L.j, hop = j.hop || 0.01, n = j.n | 0;
  const R = live(pcm.mid, pcm.sr);
  // the live series on the lane's own 10 ms grid: the NEAREST hop (10.67 ms apart at 48 kHz), the lane's rule for its own frames
  const liveS = new Float64Array(n), liveHz = new Float64Array(n).fill(-1), laneS = new Float64Array(n);
  const heldS = new Float64Array(n), rawS = new Float64Array(n).fill(NaN);
  const dt = 512 / pcm.sr, lead = STAMP === 'centre' ? 1024 / pcm.sr : 0;   // §126: the centroid stamp sits 1024 samples before the frame's end
  for (let i = 0; i < n; i++) {
    laneS[i] = j.voxS[i];
    const k = Math.round((i * hop + lead) / dt - 1);        // hop k is stamped at (k+1)·512/sr (− the lead under --stamp=centre)
    if (k >= 0 && k < R.s.length) { liveS[i] = R.s[k]; liveHz[i] = R.hz[k]; heldS[i] = R.held[k]; rawS[i] = R.raw[k]; }
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
  const st = { raw: bestLag(laneS, rawS, K), held: bestLag(laneS, heldS, K), eased: bestLag(laneS, liveS, K) };
  const main = STAGE === 'all' ? st.eased : st[STAGE] || st.eased;
  rows.push({ track, n, hops: R.s.length, kb: L.kb, lane: 100 * nLane / n, live: 100 * nLive / n, agree: 100 * agree / n,
    both: 100 * both / n, lanePitched, cover: lanePitched ? 100 * cover / lanePitched : NaN,
    semi: cover ? 100 * semi / cover : NaN, oct: cover ? 100 * oct / cover : NaN, lagMs: main.k * hop * 1000, r: main.r, r0: corrAt(laneS, liveS, 0),
    st, hop, flickLane: flicker(laneS, hop), flickLive: flicker(liveS, hop), flickHeld: flicker(heldS, hop), runsLive: runs(liveS, hop), runsLane: runs(laneS, hop) });
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
    + (lags.length ? '   |   the CNN\'s lag median ' + lags[lags.length >> 1].toFixed(0) + ' ms (' + lags.map((x) => x.toFixed(0)).join(' / ') + ', the rows with r >= ' + LAG_R + ', the ' + (STAGE === 'all' ? 'eased' : STAGE) + ' stage, hops stamped at the frame\'s ' + STAMP + ')' : ''));
}
// §126: the lag per stage, the flicker and the run lengths — the lag budget's three terms measured one by one.
console.log('\n  the lag per stage (ms, + = live LATE; hops stamped at the frame\'s ' + STAMP + '; `-` where r < ' + LAG_R + '), the hold = held − raw, the ease = eased − held; flicker = crossings of .3 per minute');
console.log('  track              lag raw   held   eased   | hold   ease   | r raw   held   eased   | flicker lane / held / live');
const lagStr = (x, hop) => x.r >= LAG_R ? (x.k * hop * 1000).toFixed(0) : '-';
for (const r of rows) {
  const a = r.st.raw, b = r.st.held, c = r.st.eased, okAll = a.r >= LAG_R && b.r >= LAG_R && c.r >= LAG_R;
  console.log('  ' + r.track.padEnd(18) + W(8, lagStr(a, r.hop)) + W(7, lagStr(b, r.hop)) + W(8, lagStr(c, r.hop))
    + '   |' + W(5, okAll ? ((b.k - a.k) * r.hop * 1000).toFixed(0) : '-') + W(7, okAll ? ((c.k - b.k) * r.hop * 1000).toFixed(0) : '-')
    + '   |' + W(6, a.r.toFixed(2)) + W(7, b.r.toFixed(2)) + W(8, c.r.toFixed(2))
    + '   |' + W(8, r.flickLane.toFixed(1)) + ' / ' + r.flickHeld.toFixed(1).padStart(5) + ' / ' + r.flickLive.toFixed(1).padStart(5));
}
console.log('\n  the voiced runs (frames ≥ .3 in a row), live | lane:');
for (const r of rows) console.log('  ' + r.track.padEnd(18) + runLine(r.runsLive) + '   |   ' + runLine(r.runsLane));
if (voiced.length) {
  const med = (xs) => { const a = xs.slice().sort((p, q) => p - q); return a.length ? a[a.length >> 1] : NaN; };
  const V = voiced.filter((r) => r.st.raw.r >= LAG_R && r.st.held.r >= LAG_R && r.st.eased.r >= LAG_R);
  if (V.length) console.log('\n  the voiced rows\' medians: raw ' + med(V.map((r) => r.st.raw.k * r.hop * 1000)).toFixed(0) + ' · held ' + med(V.map((r) => r.st.held.k * r.hop * 1000)).toFixed(0)
    + ' · eased ' + med(V.map((r) => r.st.eased.k * r.hop * 1000)).toFixed(0) + ' ms   (hold ' + med(V.map((r) => (r.st.held.k - r.st.raw.k) * r.hop * 1000)).toFixed(0) + ', ease ' + med(V.map((r) => (r.st.eased.k - r.st.held.k) * r.hop * 1000)).toFixed(0)
    + ')   flicker live / lane ' + (med(V.map((r) => r.flickLive)) / Math.max(1e-9, med(V.map((r) => r.flickLane)))).toFixed(2) + 'x');
}
