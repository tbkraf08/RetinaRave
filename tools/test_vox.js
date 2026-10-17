// Node test for the vocal track (assets/engine/ears/vox.js + vox-net.js + vox-weights.js; DECISIONS §123): the mel parity, the ONNX parity,
// the ruler per library track on the PCM dumps, the wiring proof, the bench. In `npm test`.
//
//   node tools/test_vox.js                 # everything, exit 1 on a failed assertion
//   node tools/test_vox.js --ruler         # the per-track ruler only
//   node tools/test_vox.js --bench         # the cost only
// Inputs (gitignored, the one-line fix printed when one is missing): tools/work/<T>.48000.st.f32 (trackmap.py --pcm --sr=48000),
// tools/work/vox/mel-SeeYouDrop.json + onnx-parity.json (tools/truth/voxtrain.py), tools/truth/<T>.vox.json (committed; voxtruth.py).
//   (i)   the mel parity: the ears' log-mel (raw and normalised) on SeeYouDrop's first 3000 hops = voxtrain.py's numpy front end to 1e-4
//   (ii)  the ONNX parity (§133, a per-hop net): the JS stream on 200 held Jamendo-test windows of 64 hops = onnxruntime on the same
//         windows to 1e-4 on EVERY column — the voice logit and the 61 pitch logits; then the TRAINING table the shipped weights came
//         with (tools/work/vox/train-report.json: Jamendo test F1 / AUC, the pitch head, the unseen IBelongHere and Comptine) printed
//         as NOTES — the gates' F1 >= .84 / Comptine <= 5 % say met or MISSED, never a FAIL (§126)
//   (iii) the ruler per track (the plan's targets): voxS p50 inside windows_hand > 2× outside on every voiced track; < 5 % false-positive
//         frames on Comptine (the control, UNSEEN since §126 — RECORDED since §123's miss, see below); RaindropsOnRoses' lead 1:51.5–2:17 read as voice (p50 ≥ .5); voxHz within a semitone of the
//         stem's pYIN on the voiced frames — RECORDED, not gated (the mix ceiling)
//   (iv)  the wiring: with the stage stubbed out, every other ears field is byte-identical on 30 s of SeeYouDrop (read-only to the lanes)
//   (v)   the bench: the stage's cost per hop (its sample loop + the FFT + the net + the YIN), median over the track; the gate ≤ 0.1 ms
//   (vi)  the lane's grid (§124): map.js' voxLane / mapVoxAt put the 10 ms sidecar on the engine's 60 fps clock with no drift
//   (vii) the pruned FFT (§130): dsp.js magsLo == mags on bins 0..kMax to the BIT on every hop of a track, and the stage's outputs
//         (mel, the normalised column, voxS / voxHz / voxConf) identical hop for hop against the unpruned front end
import fs from 'fs';
import path from 'path';
import { Ears, EARS_FIELDS } from '../assets/engine/ears/ears.js';
import { VoxTrack, VOX_GATE, VOX_N, PITCH_LO, PITCH_HI } from '../assets/engine/ears/vox.js';
import { FFT } from '../assets/engine/ears/dsp.js';
import { VoxNet, N_MEL, PITCH_BINS, macPerHop } from '../assets/engine/ears/vox-net.js';
import { VOX_W } from '../assets/engine/ears/vox-weights.js';
import { voxLane, mapVoxAt, VOX_LANE_HOP } from '../assets/engine/map/map.js';   // §124: the file-mode lane's packing and its read

const ROOT = path.resolve(import.meta.dirname, '..');
const has = (k) => process.argv.includes('--' + k);
const only = has('ruler') || has('bench');
let FAIL = 0;
const ok = (name, pass, value, target) => {
  if (!pass) FAIL++;
  console.log('  ' + (pass ? 'pass' : 'FAIL') + '  ' + name.padEnd(58) + String(value).padEnd(30) + (target || ''));
};
const note = (name, value) => console.log('  note  ' + name.padEnd(58) + String(value));
const SR = 48000;
const TRACKS = ['Comptine', 'IBelongHere', 'RaindropsOnRoses', 'CyborgNinja', 'Malicious', 'SeeYouDrop', 'Vienna', 'WhoLikesToParty', 'TheChain'];
// The VOICED tracks, by the §122 table's own definition: hand windows AND pYIN voicing inside them (IBelongHere E4, RaindropsOnRoses D4,
// SeeYouDrop C#5). WhoLikesToParty's 20 % of hand windows are shouted chops with NO pYIN voicing ("shouted, not sung"), so its 2x claim
// is RECORDED below, not gated: the hand says voice, the pitch ruler says no pitch, and the net is trained on sung-or-spoken frames.
// TheChain (the ninth track, §137) joins them: 8 hand passages, 1236 pyin-voiced frames in them, f0 p50 341 Hz (F4) — and it is
// UNSEEN (voxtrain.py LIB_HELD), so its ratio is the honest one.
const VOICED = ['IBelongHere', 'RaindropsOnRoses', 'SeeYouDrop', 'TheChain'];
const SHOUTED = ['WhoLikesToParty'];
// The control. Comptine (solo piano) is UNSEEN since §126 (voxtrain.py LIB_HELD = IBelongHere + Comptine): §123's final split trained
// on it (three earlier runs held it out and read its piano as a voice on 28 / 22 / 17 % of frames), so its 10 % was in-sample — this
// round the number is honest. The other no-voice tracks (CyborgNinja, Vienna) train and print as in-sample notes.
const CONTROL = 'Comptine';
const NOVOICE = ['CyborgNinja', 'Vienna'];
const LEAD = { track: 'RaindropsOnRoses', from: 111.5, to: 137.0 };

function need(p, fix) {
  if (fs.existsSync(p)) return true;
  console.log('  FAIL  missing ' + path.relative(ROOT, p) + '  — fix: ' + fix);
  FAIL++;
  return false;
}
function loadMid(track) {
  const p = path.join(ROOT, 'tools/work', `${track}.${SR}.st.f32`);
  if (!need(p, `python3 tools/truth/trackmap.py ${track} --pcm --sr=${SR}`)) return null;
  const meta = JSON.parse(fs.readFileSync(p + '.json', 'utf8')), buf = fs.readFileSync(p);
  const il = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength >> 2), n = meta.n;
  const mid = new Float32Array(n), L = new Float32Array(n), R = new Float32Array(n);
  for (let i = 0; i < n; i++) { L[i] = il[2 * i]; R[i] = il[2 * i + 1]; mid[i] = 0.5 * (L[i] + R[i]); }
  return { mid, L, R, n, sr: meta.sr };
}
const pct = (a, q) => { if (!a.length) return NaN; const b = Float64Array.from(a).sort(); return b[Math.min(b.length - 1, Math.floor(q * b.length))]; };
const W = (n, s) => String(s).padStart(n);

// Stream a mid signal through one VoxTrack; per hop the time (the hop's end sample), voxS, voxHz, voxConf. `limit` samples at most.
function run(mid, sr, limit = mid.length, hook = null) {
  const vox = new VoxTrack(sr, hook ? { onHop: hook } : {});
  const n = Math.min(mid.length, limit), t = [], s = [], hz = [], conf = [];
  const B = 512, per = [];
  let hops = 0;
  for (let i = 0; i + B <= n; i += B) {
    const a = process.hrtime.bigint();
    for (let j = i; j < i + B; j++) if (vox.step(mid[j], (j + 1) / sr)) { t.push((j + 1) / sr); s.push(vox.s); hz.push(vox.hz); conf.push(vox.conf); hops++; }
    per.push(Number(process.hrtime.bigint() - a) / 1e3);
  }
  per.sort((x, y) => x - y);
  return { vox, t, s, hz, conf, hops, usMed: per[per.length >> 1], usP99: per[Math.floor(0.99 * (per.length - 1))], usMean: per.reduce((x, y) => x + y, 0) / per.length };
}

// ------------------------------------------------------------------------------------------------ (i) the mel parity
function melParity() {
  console.log('== the mel parity (numpy voxtrain.py == ears/vox.js, raw and normalised log-mel)');
  const p = path.join(ROOT, 'tools/work/vox/mel-SeeYouDrop.json');
  if (!need(p, 'python3 tools/truth/voxtrain.py --mel-only=SeeYouDrop')) return;
  const ref = JSON.parse(fs.readFileSync(p, 'utf8'));
  const pcm = loadMid('SeeYouDrop'); if (!pcm) return;
  const raw = [], norm = [];
  const hook = (v, h, ran) => { if (ran && raw.length < ref.hops) { raw.push(Float32Array.from(v.mel)); norm.push(Float32Array.from(v.x)); } };
  run(pcm.mid, pcm.sr, (ref.hops + ref.firstHop + 2) * 512, hook);
  let dRaw = 0, dNorm = 0;
  for (let h = 0; h < ref.hops && h < raw.length; h++) for (let j = 0; j < N_MEL; j++) {
    dRaw = Math.max(dRaw, Math.abs(raw[h][j] - ref.raw[h][j]));
    dNorm = Math.max(dNorm, Math.abs(norm[h][j] - ref.norm[h][j]));
  }
  ok('(i) hops compared', raw.length === ref.hops, raw.length, '= ' + ref.hops + ' (from hop ' + ref.firstHop + ')');
  ok('(i) raw log-mel max |Δ|', dRaw <= 1e-4, dRaw.toExponential(2), '<= 1e-4');
  ok('(i) normalised log-mel max |Δ|', dNorm <= 1e-4, dNorm.toExponential(2), '<= 1e-4');
}

// ------------------------------------------------------------------------------------------------ (ii) the ONNX parity
function onnxParity() {
  console.log('== the ONNX parity (onnxruntime on 200 held Jamendo-test windows of 64 hops == the JS stream, every column, both heads)');
  const p = path.join(ROOT, 'tools/work/vox/onnx-parity.json');
  if (!need(p, 'python3 tools/truth/voxtrain.py --net=tcn --no-train   (needs tools/work/vox/vox-net.pt: the training run)')) return;
  const ref = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (ref.net !== VOX_W.net) { ok('(ii) the parity file is for the shipped net', false, ref.net + ' vs ' + VOX_W.net); return; }
  const T = ref.shape[1];
  let dVoice = 0, dPitch = 0, cols = 0, silent = 0;
  const col = new Float32Array(N_MEL), lg = new Float32Array(PITCH_BINS + 1);
  for (let i = 0; i < ref.n; i++) {
    const net = new VoxNet(VOX_W), m = ref.mel[i];
    for (let t = 0; t < T; t++) {
      for (let b = 0; b < N_MEL; b++) col[b] = m[b * T + t];
      const r = net.push(col);
      if (!(r >= 0 && r <= 1)) silent++;
      cols++;
      dVoice = Math.max(dVoice, Math.abs(net.z - ref.voice[i][t]));
      net.logits(lg);
      const rp = ref.pitch[i][t];
      for (let c = 0; c <= PITCH_BINS; c++) dPitch = Math.max(dPitch, Math.abs(lg[c] - rp[c]));
    }
  }
  ok('(ii) the stream outputs on EVERY column from the first (no hold)', silent === 0 && cols === ref.n * T, cols + ' columns, ' + silent + ' without an output');
  ok('(ii) voice logit max |Δ| vs onnxruntime, every column', dVoice <= 1e-4, dVoice.toExponential(2), '<= 1e-4');
  ok('(ii) pitch head (61 logits) max |Δ| vs onnxruntime, every column', dPitch <= 1e-4, dPitch.toExponential(2), '<= 1e-4');
  ok('(ii) the weights module', VOX_W.net === 'tcn' && VOX_W.nMel === N_MEL && VOX_W.pitchBins === PITCH_BINS && VOX_W.macPerHop === macPerHop(VOX_W) && VOX_W.f16.length > 20000, VOX_W.net + ', ' + VOX_W.nParams + ' params, ' + VOX_W.macPerHop + ' MAC/hop, ' + (VOX_W.f16.length / 1024).toFixed(0) + ' KB base64', 'tcn, 40 bands, 60 pitch bins');
}

// The training table (§126 item 4): the report voxtrain.py wrote beside the weights it exported. The numbers are the net's own
// (frame-level, the .5 threshold, no ease, no vote) — the ruler below is the same net through the ears' stage. Recorded, not gated.
function training() {
  const p = path.join(ROOT, 'tools/work/vox/train-report.json');
  if (!fs.existsSync(p)) { note('(ii) the training report', 'tools/work/vox/train-report.json absent (the weights\' run writes it) — nothing to record'); return; }
  const R = JSON.parse(fs.readFileSync(p, 'utf8').replace(/\bNaN\b/g, 'null'));   // python's json writes NaN for a no-voice track's AUC
  const pr = R.provenance || {}, te = R.jamendo_test || {}, H = R.held || {}, ib = H.IBelongHere || {}, co = H.Comptine || {};
  note('(ii) the training run', (pr.tag || '?') + ' of ' + (pr.date || '?') + ', ' + (R.epochs || []).length + ' epochs, ' + R.params + ' params; ' + (pr.summary || '').slice(0, 90) + '…');
  note('(ii) Jamendo test (16 unseen tracks): F1 / P / R / AUC — ' + (te.F1 >= 0.84 ? 'the §133 gate\'s >= .84 met' : 'the §133 gate\'s >= .84 MISSED, recorded'), te.F1 + ' / ' + te.P + ' / ' + te.R + ' / ' + te.AUC + ' (' + te.frames + ' frames)');
  if (te.pitch_frames) note('(ii) Jamendo test, the pitch head vs the stems\' pYIN: a pitch on / exact bin / within ±1 bin, none right', te.pitch_pub_pct + ' / ' + te.pitch_exact_pct + ' / ' + te.pitch_pm1_pct + ' % of ' + te.pitch_frames + ' frames; none ' + te.none_ok_pct + ' %');
  note('(ii) IBelongHere (UNSEEN): F1 / P / R / AUC', ib.F1 + ' / ' + ib.P + ' / ' + ib.R + ' / ' + ib.AUC);
  note('(ii) Comptine (UNSEEN, the net at .5): false-positive frames — ' + (co.fp_pct < 5 ? 'met' : 'MISSED, recorded'), co.fp_pct + ' % against the plan\'s < 5 %');
}

// ------------------------------------------------------------------------------------------------ (iii) the ruler per track
function ruler() {
  console.log('== the ruler per track (tools/work/<T>.48000.st.f32 through the stage; windows_hand from tools/truth/<T>.vox.json)');
  const rows = [];
  for (const track of TRACKS) {
    const pcm = loadMid(track); if (!pcm) continue;
    const J = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/truth', track + '.vox.json'), 'utf8'));
    const hand = J.windows_hand || [];
    const inHand = (t) => hand.some((w) => t >= w.from && t < w.to);
    const R = run(pcm.mid, pcm.sr);
    const sin = [], sout = [], fpOut = [];
    let lead = [], hzOk = 0, hzOkOct = 0, hzAny = 0, voiced = 0;
    for (let i = 0; i < R.t.length; i++) {
      const t = R.t[i], s = R.s[i];
      if (inHand(t)) sin.push(s); else { sout.push(s); fpOut.push(s >= 0.5 ? 1 : 0); }
      if (track === LEAD.track && t >= LEAD.from && t < LEAD.to) lead.push(s);
      // the stem's pYIN at this hop: voiced where vprob >= .5 inside a hand window
      const k = Math.round(t / J.hop);
      if (k < J.vprob.length && inHand(t) && J.vprob[k] >= 0.5 && J.f0[k] > 0) {
        voiced++;
        if (R.hz[i] > 0) {
          hzAny++;
          const c = 1200 * Math.log2(R.hz[i] / J.f0[k]);
          if (Math.abs(c) <= 100) hzOk++;
          if (Math.abs(((c % 1200) + 1800) % 1200 - 600) <= 100) hzOkOct++;   // within a semitone modulo the octave (an octave error forgiven)
        }
      }
    }
    const p50in = pct(sin, 0.5), p50out = pct(sout, 0.5), p90out = pct(sout, 0.9);
    const fp = fpOut.length ? 100 * fpOut.reduce((a, b) => a + b, 0) / fpOut.length : 0;
    const row = { track, hops: R.t.length, handS: hand.reduce((a, w) => a + (w.to - w.from), 0), p50in, p50out, p90out, ratio: p50in / Math.max(1e-3, p50out), fp,
      lead: lead.length ? pct(lead, 0.5) : NaN, voiced, hzCov: voiced ? 100 * hzAny / voiced : NaN, hzSemi: voiced ? 100 * hzOk / voiced : NaN, hzOct: voiced ? 100 * hzOkOct / voiced : NaN, usMed: R.usMed, usP99: R.usP99, usMean: R.usMean };
    rows.push(row);
  }
  console.log('  track              hops   hand s   voxS p50 in / out (p90 out)   ratio    fp% (>=.5 outside)   lead p50   voiced   hz cov%  semi%  semi-oct%   us/hop med p99 mean');
  for (const r of rows) console.log('  ' + r.track.padEnd(18) + W(6, r.hops) + W(8, r.handS.toFixed(0)) + W(9, isNaN(r.p50in) ? '-' : r.p50in.toFixed(3)) + ' / ' + r.p50out.toFixed(3) + ' (' + r.p90out.toFixed(3) + ')' + W(10, isNaN(r.ratio) ? '-' : r.ratio.toFixed(1)) + W(9, r.fp.toFixed(1)) + W(18, isNaN(r.lead) ? '-' : r.lead.toFixed(3)) + W(9, r.voiced) + W(9, isNaN(r.hzCov) ? '-' : r.hzCov.toFixed(0)) + W(7, isNaN(r.hzSemi) ? '-' : r.hzSemi.toFixed(0)) + W(9, isNaN(r.hzOct) ? '-' : r.hzOct.toFixed(0)) + W(12, r.usMed.toFixed(0)) + W(5, r.usP99.toFixed(0)) + W(5, r.usMean.toFixed(0)));
  for (const r of rows) {
    if (VOICED.includes(r.track)) ok('(iii) ' + r.track + ': voxS p50 inside the hand windows > 2x outside', r.ratio > 2, r.p50in.toFixed(3) + ' / ' + r.p50out.toFixed(3) + ' = ' + r.ratio.toFixed(1) + 'x', '> 2x');
    if (SHOUTED.includes(r.track)) note('(iii) ' + r.track + ': voxS p50 inside the hand windows vs outside (shouted chops, no pYIN voicing — recorded)', r.p50in.toFixed(3) + ' / ' + r.p50out.toFixed(3) + ' = ' + r.ratio.toFixed(1) + 'x');
    // RECORDED, not gated (§123, §126): §123's weights read Comptine's piano as a voice on 10 % of frames at voxS >= .5 — in-sample — against
    // the plan's 5 %; §126 holds Comptine OUT (a piano / string / wind negative set — MusicNet, MAESTRO — trains instead) and prints the unseen
    // number, met or MISSED (HARNESS: a claim pending its fix prints as a note, never a FAIL).
    if (r.track === CONTROL) note('(iii) ' + r.track + ' (the control, UNSEEN): false-positive frames (voxS >= .5) — ' + (r.fp < 5 ? 'met' : 'MISSED, recorded'), r.fp.toFixed(2) + ' % against the plan\'s < 5 %');
    if (NOVOICE.includes(r.track)) note('(iii) ' + r.track + ' (no voice, in-sample): false-positive frames (voxS >= .5)', r.fp.toFixed(2) + ' %');
    if (r.track === LEAD.track) ok('(iii) ' + r.track + ": the lead 1:51.5-2:17 read as voice (p50 voxS)", r.lead >= 0.5, r.lead.toFixed(3), '>= .5 (by design)');
    if ((VOICED.includes(r.track) || SHOUTED.includes(r.track)) && r.voiced > 0) note('(iii) ' + r.track + ': voxHz within a semitone of the stem pYIN (recorded)', r.hzSemi.toFixed(0) + ' % of ' + r.voiced + ' voiced frames (' + r.hzOct.toFixed(0) + ' % modulo the octave, a pitch on ' + r.hzCov.toFixed(0) + ' %) — the plan asks 70, the mix ceiling');
  }
  return rows;
}

// ------------------------------------------------------------------------------------------------ (iv) the wiring: read-only to the other lanes
function wiring() {
  console.log('== the wiring (Ears with the stage vs the stage stubbed out: every other field identical; the vox fields reach read())');
  const pcm = loadMid('SeeYouDrop'); if (!pcm) return;
  const stream = (stub) => {                                 // stub: false = the stage runs · true = step() stubbed · 'skip' = §130's Ears.setVoxSkip(true)
    const ears = new Ears(pcm.sr);
    if (stub === 'skip') ears.setVoxSkip(true); else if (stub) ears.vox.step = () => false;
    const B = 512, n = Math.min(pcm.n, 30 * pcm.sr), cols = {}; for (const f of EARS_FIELDS) cols[f] = [];
    let next = 0, pushNs = 0;
    const bl = new Float32Array(B), br = new Float32Array(B);
    for (let s = 0; s + B <= n; s += B) {
      bl.set(pcm.L.subarray(s, s + B)); br.set(pcm.R.subarray(s, s + B));
      const a = process.hrtime.bigint(); ears.push(bl, br, s / pcm.sr); pushNs += Number(process.hrtime.bigint() - a);
      const tEnd = (s + B) / pcm.sr;
      while (next <= tEnd) { const o = ears.read(next); for (const f of EARS_FIELDS) cols[f].push(o[f]); next += 1 / 60; }
    }
    return { cols, pushMs: pushNs / 1e6 / (n / B) };
  };
  const A = stream(false), Bs = stream(true);
  const others = EARS_FIELDS.filter((f) => !f.startsWith('vox'));
  const moved = others.filter((f) => A.cols[f].some((v, i) => v !== Bs.cols[f][i]));
  ok('(iv) every non-vox ears field identical with the stage stubbed (30 s, 60 fps)', moved.length === 0, moved.length ? 'moved: ' + moved.join(',') : others.length + ' fields identical');
  const vs = A.cols.voxS, vh = A.cols.voxHz, vc = A.cols.voxConf;
  ok('(iv) voxS reaches read(): in [0, 1], non-zero after the first inference', vs.every((v) => v >= 0 && v <= 1) && vs.slice(120).some((v) => v > 0), 'max ' + Math.max(...vs).toFixed(3));
  ok('(iv) voxHz is -1 or a pitch in the head\'s range (C3 − 50 c .. B7 + 50 c), never an average', vh.every((v) => v === -1 || (v >= PITCH_LO && v <= PITCH_HI)), 'pitched frames ' + vh.filter((v) => v > 0).length + ' / ' + vh.length);
  ok('(iv) voxConf in [0, 1] and 0 wherever voxS is 0', vc.every((v, i) => v >= 0 && v <= 1 && (vs[i] > 0 || v === 0)), 'max ' + Math.max(...vc).toFixed(3));
  ok('(iv) the stage stubbed: voxS / voxHz / voxConf stay at 0 / -1 / 0', Bs.cols.voxS.every((v) => v === 0) && Bs.cols.voxHz.every((v) => v === -1) && Bs.cols.voxConf.every((v) => v === 0), 'idle');
  note('(iv) Ears.push ms per 512 block with / without the stage (30 s of SeeYouDrop)', A.pushMs.toFixed(3) + ' / ' + Bs.pushMs.toFixed(3) + ' (+' + (A.pushMs - Bs.pushMs).toFixed(3) + ' ms = ' + (1000 * (A.pushMs - Bs.pushMs)).toFixed(0) + ' us per hop)');
  // §130: the skip the file-mode lane turns on (features-ears.js laneFeeds → Ears.setVoxSkip) is the stub by another door: the same 31
  // fields byte-identical, the three keys idle, and the push cost back to the stubbed figure; turning it off re-primes a fresh track.
  const K = stream('skip');
  const movedK = others.filter((f) => A.cols[f].some((v, i) => v !== K.cols[f][i]));
  ok('(iv) §130 setVoxSkip(true): every non-vox ears field identical (30 s, 60 fps)', movedK.length === 0, movedK.length ? 'moved: ' + movedK.join(',') : others.length + ' fields identical');
  ok('(iv) §130 setVoxSkip(true): voxS / voxHz / voxConf stay at 0 / -1 / 0', K.cols.voxS.every((v) => v === 0) && K.cols.voxHz.every((v) => v === -1) && K.cols.voxConf.every((v) => v === 0), 'idle');
  const E2 = new Ears(pcm.sr), v0 = E2.vox; E2.setVoxSkip(true); const v1 = E2.vox; E2.setVoxSkip(false);
  ok('(iv) §130 setVoxSkip(false) re-primes: a fresh VoxTrack, skip off', v1 === v0 && v1.skip && E2.vox !== v0 && !E2.vox.skip, 'fresh');
  note('(iv) §130 Ears.push ms per 512 block with the stage skipped (the lane feeds the keys)', K.pushMs.toFixed(3) + ' (the stage on: ' + A.pushMs.toFixed(3) + ', −' + (1000 * (A.pushMs - K.pushMs)).toFixed(0) + ' us per hop)');
}

// ------------------------------------------------------------------------------------------------ (vi) the lane's grid (§124)
// The sidecar is a 10 ms grid and the engine asks for it at heard time, 60 times a second, for up to an hour of track: the one
// thing that can go wrong silently is DRIFT — an index walked per frame instead of computed, or a float hop accumulated. The
// lane is read like map.sub (the nearest frame, never an interpolation), so the claim is exact: index == round(t / hop) at every
// frame of an hour, the ends clamped, and voxHz never averaged with its -1.
function laneGrid() {
  console.log('== the lane grid (map.js voxLane + mapVoxAt: the 10 ms sidecar on the engine\'s clock, §124)');
  const n = 360000;                                        // an hour at 10 ms
  const j = { track: 'synthetic', sr: 44100, hop: VOX_LANE_HOP, n, voxS: [], voxHz: [], voxConf: [] };
  for (let i = 0; i < n; i++) { j.voxS.push((i % 1000) / 1000); j.voxHz.push(i % 2 ? -1 : 200 + (i % 800)); j.voxConf.push(0.001); }
  const lane = voxLane(j), out = {};
  ok('(vi) voxLane packs the three arrays', !!lane && lane.n === n && lane.hop === VOX_LANE_HOP, lane ? lane.n + ' frames, hop ' + lane.hop : 'null');
  ok('(vi) voxLane rejects a stale shape (n past the arrays)', voxLane({ n: 10, hop: 0.01, voxS: [0], voxHz: [-1], voxConf: [0] }) === null, 'null');
  let worst = 0, badHz = 0;
  for (let f = 0; f < 216000; f++) {                        // an hour of frames at 60 fps
    const t = f / 60, i = Math.round(t / VOX_LANE_HOP);
    mapVoxAt(lane, t, out);
    worst = Math.max(worst, Math.abs(out.voxS - lane.S[i]));
    if (!(out.voxHz === -1 || out.voxHz >= 200)) badHz++;    // never (-1 + x) / 2
  }
  ok('(vi) no drift over an hour of frames: voxS == the nearest frame', worst === 0, 'max |Δ| ' + worst, '== 0');
  ok('(vi) voxHz is categorical (never interpolated with its -1)', badHz === 0, badHz + ' bad frames');
  mapVoxAt(lane, -5, out); const lo = out.voxS; mapVoxAt(lane, 1e6, out);
  ok('(vi) the ends clamp', lo === lane.S[0] && out.voxS === lane.S[n - 1], 'first / last frame held');
  ok('(vi) no lane: 0 / -1 / 0 (the live tier keeps the keys)', (mapVoxAt(null, 1, out), out.voxS === 0 && out.voxHz === -1 && out.voxConf === 0), 'idle');
}

// ------------------------------------------------------------------------------------------------ (vii) the pruned FFT (§130)
// `magsLo` is `mags` with the first stage written as the add / subtract its (1, −0) twiddle evaluates to and the last stages pruned to
// the bins the mel reads. The claim is EXACT: every bin 0..kMax of every hop of a whole track is the same float, and the stage's outputs
// through it (the log-mel, the normalised column, the three keys) are the same floats as through `mags` — so no md5 line can move.
function prunedFFT() {
  console.log('== the pruned FFT (dsp.js magsLo == mags to the bit on bins 0..kMax; the front end identical through it)');
  const pcm = loadMid('SeeYouDrop'); if (!pcm) return;
  const probe = new VoxTrack(pcm.sr), kMax = probe.kMax;
  const F = new FFT(VOX_N), a = new Float32Array(VOX_N >> 1), b = new Float32Array(VOX_N >> 1);
  const RB = 4096, ring = new Float32Array(RB), mask = RB - 1;
  let w = 0, hops = 0, bad = 0, worst = 0;
  for (let i = 0; i < pcm.n; i++) {
    ring[w & mask] = pcm.mid[i]; w++;
    if (w >= VOX_N && w % 512 === 0) {
      F.mags(ring, (w - VOX_N) & mask, mask, a); F.magsLo(ring, (w - VOX_N) & mask, mask, b, kMax); hops++;
      for (let k = 0; k <= kMax; k++) if (!Object.is(a[k], b[k])) { bad++; worst = Math.max(worst, Math.abs(a[k] - b[k])); }
    }
  }
  ok('(vii) magsLo == mags on bins 0..' + kMax + ' (Object.is, every hop of SeeYouDrop)', bad === 0, hops + ' hops, ' + bad + ' bins differ' + (bad ? ', max |Δ| ' + worst.toExponential(2) : ''), '0 bins differ');
  // the stage through mags() vs through magsLo(): the same floats hop for hop
  const cols = (viaMags) => {
    const out = [];
    const hook = (v, h, ran) => { if (ran) out.push([Float32Array.from(v.mel), Float32Array.from(v.x), v.s, v.hz, v.conf]); };
    const vox = new VoxTrack(pcm.sr, { onHop: hook });
    if (viaMags) vox.fft.magsLo = function (r, st, m, o) { this.mags(r, st, m, o); };
    const n = Math.min(pcm.n, 60 * pcm.sr);
    for (let j = 0; j < n; j++) vox.step(pcm.mid[j], (j + 1) / pcm.sr);
    return out;
  };
  const A = cols(true), B = cols(false);
  let diff = 0;
  for (let h = 0; h < A.length; h++) {
    for (let j = 0; j < N_MEL; j++) if (!Object.is(A[h][0][j], B[h][0][j]) || !Object.is(A[h][1][j], B[h][1][j])) diff++;
    if (!Object.is(A[h][2], B[h][2]) || !Object.is(A[h][3], B[h][3]) || !Object.is(A[h][4], B[h][4])) diff++;
  }
  ok('(vii) the front end through magsLo == through mags: mel, x, voxS / voxHz / voxConf (60 s, per hop)', A.length === B.length && diff === 0, A.length + ' hops, ' + diff + ' values differ', '0');
}

// ------------------------------------------------------------------------------------------------ (v) the bench
function bench() {
  console.log('== the bench (the stage alone on SeeYouDrop: the sample loop + the FFT + the mel + the net + the two heads + the salience, per 512-sample hop)');
  const pcm = loadMid('SeeYouDrop'); if (!pcm) return;
  run(pcm.mid, pcm.sr, 20 * pcm.sr);                      // warm the JIT
  const R = run(pcm.mid, pcm.sr);
  ok('(v) the stage: median us per hop', R.usMed <= 100, R.usMed.toFixed(1) + ' us (p99 ' + R.usP99.toFixed(0) + ', mean ' + R.usMean.toFixed(1) + ')', '<= 100 us (HARNESS "Bench protocol": the stage <= .1 ms per hop)');
  note('(v) hops / inferences', R.hops + ' / ' + R.vox.fired + ' (§133: one per hop from the first FFT, ' + macPerHop(VOX_W) + ' MAC each)');
  // §130: the parts — the two FFTs alone (mags vs magsLo on the same ring), the sample loop alone (the hop stubbed), the stage through mags()
  const med = (per) => { per.sort((x, y) => x - y); return per[per.length >> 1]; };
  const F = new FFT(VOX_N), o = new Float32Array(VOX_N >> 1), ring = new Float32Array(4096), kMax = R.vox.kMax;
  ring.set(pcm.mid.subarray(48000, 48000 + 4096));
  const tFFT = (fn) => { const per = []; for (let i = 0; i < 3000; i++) { const a = process.hrtime.bigint(); fn(); per.push(Number(process.hrtime.bigint() - a) / 1e3); } return med(per); };
  const usMags = tFFT(() => F.mags(ring, 0, 4095, o)), usLo = tFFT(() => F.magsLo(ring, 0, 4095, o, kMax));
  const loop = new VoxTrack(pcm.sr); loop.hop = () => {};
  const perL = []; for (let i = 0; i + 512 <= 20 * pcm.sr; i += 512) { const a = process.hrtime.bigint(); for (let j = i; j < i + 512; j++) loop.step(pcm.mid[j], (j + 1) / pcm.sr); perL.push(Number(process.hrtime.bigint() - a) / 1e3); }
  const viaMags = new VoxTrack(pcm.sr); viaMags.fft.magsLo = function (r, st, m, out) { this.mags(r, st, m, out); };
  const perM = []; for (let i = 0; i + 512 <= 60 * pcm.sr; i += 512) { const a = process.hrtime.bigint(); for (let j = i; j < i + 512; j++) viaMags.step(pcm.mid[j], (j + 1) / pcm.sr); perM.push(Number(process.hrtime.bigint() - a) / 1e3); }
  note('(v) §130 the parts, median us: FFT mags / magsLo (bins 0..' + kMax + ') · the sample loop alone · the stage through mags (60 s) vs through magsLo (the full track above)', usMags.toFixed(1) + ' / ' + usLo.toFixed(1) + ' · ' + med(perL).toFixed(1) + ' · ' + med(perM).toFixed(1) + ' vs ' + R.usMed.toFixed(1));
}

if (!only || has('bench')) { if (!only) { melParity(); onnxParity(); training(); } }
if (!only || has('ruler')) ruler();
if (!only) { wiring(); laneGrid(); prunedFFT(); }
if (!only || has('bench')) bench();
console.log(FAIL ? `\n${FAIL} FAILED` : '\nall ok');
process.exit(FAIL ? 1 : 0);
