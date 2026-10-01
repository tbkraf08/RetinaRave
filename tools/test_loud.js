// Node test of the TRUE-LOUDNESS stage (assets/engine/loud.js) — docs/plans/LOUDNESS-PLAN.md phases 2 and 3.
// Everything is pushed through the PCM bus's own 512-sample stereo blocks, exactly as features-loud.js feeds it.
//
//   node tools/test_loud.js            synthetic only, ~1 s — what npm test runs
//   node tools/test_loud.js --truth    + the five tracks, frame by frame against TWO references, and the truth-graded
//                                      breakdown -> drop pairs (phase 3). Needs the 48 kHz stereo PCM dumps in
//                                      tools/work/ — `trackmap.py <Track> --pcm --sr=48000` makes them, but note that
//                                      it runs the FULL analysis and REWRITES tools/truth/<Track>.json, so never run
//                                      it on a track another worker is annotating (use the dump that is already there).
//
// The synthetic cases:
//   coef48      kcoef(48000) equals the BS.1770-4 table (the spec tabulates 48 kHz only; every other rate is derived)
//   response    the K-weighting magnitude response: the +3.999 dB shelf lift, |H| = Q at the RLB corner, the mid-band level
//   step        a -23 -> -13 LKFS step of a 997 Hz stereo sine reads +10.00 LU, and each level absolutely to 0.02 LU
//   windows     the momentary window IS 400 ms and the short-term one IS 3 s (the step's rise time measures them)
//   heard       read(t) behind the newest block = the window ending at t, not the newest window
//   peak        loudPk: instant attack, PK_REL LU/s release (a straight line in dB), and the warm-up guard
//   range       loudRange = p95 - p10 of loudS, inside 0.6 LU of the truth on a two-level signal
//   gain        x0.1 on the whole signal: loudS exactly -20 LU, loudRel and loudRange IDENTICAL (the capture path)
//   sr44        44.1 kHz reads the same LKFS as 48 kHz on the same tone (the derived coefficients)
//   determ      two runs are identical to the last bit
//   cost        µs per block and per frame at 48 kHz / 60 fps
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Loud, kcoef, K48, LOUDK, LOUD_OFS, MOM_W, SHORT_W } from '../assets/engine/loud.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const B = 512, SR = 48000;
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('ok   ' + m); } else { fail++; console.log('FAIL ' + m); } };
const near = (a, b, tol, m) => ok(Math.abs(a - b) <= tol, `${m}: ${a.toFixed(4)} vs ${b.toFixed(4)} (tol ${tol})`);

// ---------------------------------------------------------------------------------------------------- the signals
// A stereo 997 Hz sine whose AMPLITUDE is `amp(t)` (so a level change is a step in amp), sr samples per second.
function tone(secs, sr, amp, f = 997) {
  const n = Math.ceil(secs * sr), L = new Float32Array(n), R = new Float32Array(n);
  for (let i = 0; i < n; i++) { const v = Math.sin(2 * Math.PI * f * i / sr) * amp(i / sr); L[i] = v; R[i] = v; }
  return { L, R, sr };
}
// Push a signal through a Loud in 512-sample blocks; `at` = read times -> rows [{t, loudM, loudS, loudPk, loudRel, loudRange}]
function run(sig, at = [], opts = {}) {
  const lo = new Loud(sig.sr, opts), bl = new Float32Array(B), br = new Float32Array(B);
  const rows = [], want = at.slice().sort((a, b) => a - b);
  let k = 0;
  for (let s = 0; s + B <= sig.L.length; s += B) {
    bl.set(sig.L.subarray(s, s + B)); br.set(sig.R.subarray(s, s + B));
    const t0 = s / sig.sr;
    lo.push(bl, br, t0);
    const tEnd = t0 + B / sig.sr;
    while (k < want.length && want[k] <= tEnd) { const o = {}; lo.read(want[k], o); rows.push({ t: want[k], ...o }); k++; }
  }
  return { lo, rows };
}
// The closed-form loudness of a steady stereo sine of amplitude a at f: |H(f)|^2 * a^2/2 per channel, two channels.
function biq(c, w) {                                   // |H(e^jw)| of one (b0,b1,b2,a1,a2)
  const [b0, b1, b2, a1, a2] = c;
  const nr = b0 + b1 * Math.cos(w) + b2 * Math.cos(2 * w), ni = -(b1 * Math.sin(w) + b2 * Math.sin(2 * w));
  const dr = 1 + a1 * Math.cos(w) + a2 * Math.cos(2 * w), di = -(a1 * Math.sin(w) + a2 * Math.sin(2 * w));
  return Math.sqrt((nr * nr + ni * ni) / (dr * dr + di * di));
}
const kmag = (sr, f) => { const c = kcoef(sr), w = 2 * Math.PI * f / sr; return biq(c.shelf, w) * biq(c.hp, w); };
const sineLkfs = (sr, f, a) => LOUD_OFS + 10 * Math.log10(2 * Math.pow(kmag(sr, f) * a, 2) / 2);
// the amplitude a 997 Hz stereo sine needs to read `l` LKFS
const sineAmp = (sr, f, l) => Math.sqrt(Math.pow(10, (l - LOUD_OFS) / 10) / (Math.pow(kmag(sr, f), 2)));

// ---------------------------------------------------------------------------------------------------- coef48
{
  const c = kcoef(48000);
  let d = 0;
  for (const k of ['shelf', 'hp']) for (let i = 0; i < 5; i++) d = Math.max(d, Math.abs(c[k][i] - K48[k][i]));
  ok(d < 1e-12, `coef48: the bilinear recipe reproduces the BS.1770-4 48 kHz table (max |diff| ${d.toExponential(2)})`);
}
// ---------------------------------------------------------------------------------------------------- response
{
  const c = kcoef(SR), W = (f) => 2 * Math.PI * f / SR;
  const sdb = (f) => 20 * Math.log10(biq(c.shelf, W(f))), hdb = (f) => 20 * Math.log10(biq(c.hp, W(f)));
  const db = (f) => 20 * Math.log10(kmag(SR, f));
  // the two sections on their own: the shelf's +4 dB of HF lift over its own low-frequency gain, and the RLB corner
  near(sdb(10000) - sdb(100), 3.999, 0.02, 'response: the high shelf lifts HF by +3.999 dB over LF');
  // at a 2nd-order high-pass's corner |H| IS its Q, and the RLB's Q is 0.5003270373238773 -> -6.02 dB (not -3: the
  // spec's "-3 dB point" is higher up the slope). The HF asymptote is unity, which is what makes the shelf's +4 dB the
  // whole of the K curve's lift.
  near(hdb(38.13547087602444), 20 * Math.log10(0.5003270373238773), 0.06, 'response: the RLB high-pass is |H| = Q at its 38.135 Hz corner');
  near(hdb(20000), 0.0, 0.05, 'response: ... and unity well above it');
  // the combined K curve, as BS.1770 draws it: ~0 dB through the mids, the +4 dB shelf on top at HF, the low end gone
  near(db(997), 0.70, 0.05, 'response: 997 Hz sits at +0.70 dB on the combined K curve');
  near(db(10000) - db(997), 3.33, 0.05, 'response: 10 kHz is 3.33 dB above 997 Hz');
  ok(db(20) < -11, `response: 20 Hz is ${db(20).toFixed(2)} dB — the RLB high-pass really is a high-pass`);
}
// ---------------------------------------------------------------------------------------------------- step
{
  const a1 = sineAmp(SR, 997, -23), a2 = sineAmp(SR, 997, -13);
  const sig = tone(24, SR, (t) => (t < 12 ? a1 : a2));
  const { rows } = run(sig, [11.0, 11.9, 12.5, 15.5, 20.0, 23.0]);
  const at = (t) => rows.find((r) => Math.abs(r.t - t) < 1e-6);
  near(at(11.0).loudS, -23, 0.02, 'step: the -23 LKFS half reads -23 (short-term)');
  near(at(11.0).loudM, -23, 0.02, 'step: ... and momentary');
  near(at(20.0).loudS, -13, 0.02, 'step: the -13 LKFS half reads -13 (short-term)');
  near(at(20.0).loudS - at(11.0).loudS, 10, 0.02, 'step: the step is +10.00 LU on loudS');
  near(at(20.0).loudM - at(11.0).loudM, 10, 0.02, 'step: ... and on loudM');
  // --- windows: the rise time IS the window length
  const fine = [];
  for (let t = 11.95; t <= 15.2; t += 0.01) fine.push(+t.toFixed(3));
  const F = run(tone(18, SR, (t) => (t < 12 ? a1 : a2)), fine).rows;
  const riseTo = (f, frac) => { const r = F.find((x) => f(x) >= -23 + 10 * frac); return r ? r.t - 12 : NaN; };
  near(riseTo((r) => r.loudM, 0.999), MOM_W, 0.02, 'windows: loudM is within 0.01 LU of the new level 400 ms after the step');
  near(riseTo((r) => r.loudS, 0.999), SHORT_W, 0.03, 'windows: loudS 3.0 s after it');
  ok(riseTo((r) => r.loudM, 0.5) > 0.03 && riseTo((r) => r.loudM, 0.5) < 0.2,
    `windows: loudM is half way up at ${(1000 * riseTo((r) => r.loudM, 0.5)).toFixed(0)} ms (a mean square, not an EMA)`);
}
// ---------------------------------------------------------------------------------------------------- heard
{
  const a1 = sineAmp(SR, 997, -20), a2 = sineAmp(SR, 997, -8);
  const sig = tone(20, SR, (t) => (t < 14 ? a1 : a2));
  const push = (lo) => { const bl = new Float32Array(B), br = new Float32Array(B);
    for (let s = 0; s + B <= sig.L.length; s += B) { bl.set(sig.L.subarray(s, s + B)); br.set(sig.R.subarray(s, s + B)); lo.push(bl, br, s / SR); } return lo; };
  const big = push(new Loud(SR, { ring: 32768 })), back = {}, now = {};   // a test ring: 21.8 s, so a 10 s lookback fits
  big.read(10.0, back); big.read(19.9, now);
  near(back.loudS, -20, 0.02, 'heard: read(10 s) after the whole 20 s is in = the window ENDING at 10 s, not the newest');
  near(now.loudS, -8, 0.02, 'heard: read(19.9 s) = the newest window');
  ok(back.loudPk < now.loudPk - 1e-6, 'heard: loudPk read in the past is not the present peak');
  // the ring IS the lookback budget: the default 576 blocks hold ~6.1 s at 48 kHz, which is twice the longest window
  // plus the slack heard time needs (DET_LEAD 43 ms + the display lead). Past that a read falls off the end and says so.
  const small = push(new Loud(SR, { ring: 256 })), far = {};   // 256 blocks = 2.73 s: not even one short-term window
  small.read(10.0, far);
  ok(far.loudS <= -99, `heard: a window the ring cannot cover reads the floor (${far.loudS.toFixed(0)}) instead of lying`);
  const edge = {};
  push(new Loud(SR)).read(17.5, edge);                    // the window (14.5, 17.5] is in the loud half; 5.47 s of span
  near(edge.loudS, -8, 0.02, 'heard: a window needing 5.47 s of the ring is still inside the default one');
}
// ---------------------------------------------------------------------------------------------------- peak / rel
{
  const aL = sineAmp(SR, 997, -6), aQ = sineAmp(SR, 997, -18);
  const sig = tone(70, SR, (t) => (t < 30 ? aL : aQ));           // 30 s loud, 40 s quiet
  const { rows } = run(sig, [29.5, 34, 44, 54, 64, 69.5]);
  const at = (t) => rows.find((r) => Math.abs(r.t - t) < 1e-6);
  near(at(29.5).loudPk, -6, 0.05, 'peak: the hold is at the loud level while it plays (instant attack)');
  const d10 = at(44).loudPk - at(34).loudPk;
  near(d10 / 10, -LOUDK.PK_REL, 1e-4, 'peak: the release is PK_REL LU/s — a straight line in dB');
  near(at(64).loudPk - at(34).loudPk, -30 * LOUDK.PK_REL, 1e-3, 'peak: ... and it holds that rate over 30 s');
  ok(at(69.5).loudPk > at(69.5).loudS - 1e-6, 'peak: the hold never falls below the present loudness');
  // loudRel: the loud section is at the peak, the quiet one 12 LU under it while the hold still remembers
  near(at(29.5).loudRel, 1, 0.01, 'rel: loudRel is 1 at the track\'s own loudest');
  const want = (at(34).loudS - at(34).loudPk + LOUDK.RANGE) / LOUDK.RANGE;
  near(at(34).loudRel, want, 1e-6, 'rel: loudRel is clamp01((loudS - loudPk + RANGE) / RANGE)');
  ok(at(34).loudRel < at(29.5).loudRel - 0.3, `rel: 12 LU down reads ${at(34).loudRel.toFixed(3)} against 1.000`);
  // the warm-up guard: the FIRST seconds of a stream are not its brightest
  const w = run(tone(8, SR, () => aL), [4.0, 7.5]).rows;
  ok(w[0].loudRel < 0.92, `rel: the warm-up guard holds the first seconds at loudRel ${w[0].loudRel.toFixed(3)} (< 0.92), not 1.0`);
  near(w[0].loudPk - w[0].loudS, LOUDK.WARM_LU * Math.exp(-4 / LOUDK.WARM_T), 0.01, 'rel: the guard is WARM_LU decayed by the stream\'s age');
  ok(w[1].loudRel > w[0].loudRel, 'rel: ... and it lets go as the stream ages');
}
// ---------------------------------------------------------------------------------------------------- range
{
  const aA = sineAmp(SR, 997, -6), aB = sineAmp(SR, 997, -14);   // alternating 8 s blocks: the true p95-p10 is 8 LU
  const sig = tone(96, SR, (t) => (Math.floor(t / 8) % 2 ? aB : aA));
  const r = run(sig, [95.0]).rows[0];
  near(r.loudRange, 8, 0.6, 'range: loudRange = p95 - p10 of loudS on a signal whose true span is 8 LU');
}
// ---------------------------------------------------------------------------------------------------- gain
{
  const a = sineAmp(SR, 997, -8);
  const mk = (g) => tone(60, SR, (t) => a * g * (Math.floor(t / 7) % 2 ? 0.25 : 1));
  const A = run(mk(1), [20, 40, 59]).rows, Bq = run(mk(0.1), [20, 40, 59]).rows;
  let dS = 0, dRel = 0, dRg = 0;
  for (let i = 0; i < A.length; i++) {
    dS = Math.max(dS, Math.abs((A[i].loudS - Bq[i].loudS) - 20));
    dRel = Math.max(dRel, Math.abs(A[i].loudRel - Bq[i].loudRel));
    dRg = Math.max(dRg, Math.abs(A[i].loudRange - Bq[i].loudRange));
  }
  ok(dS < 1e-6, `gain: x0.1 moves loudS by exactly -20.00 LU (max |err| ${dS.toExponential(1)})`);
  ok(dRel < 1e-9 && dRg < 1e-9, `gain: loudRel and loudRange are IDENTICAL under a gain change (${dRel.toExponential(1)} / ${dRg.toExponential(1)}) — the capture path`);
}
// ---------------------------------------------------------------------------------------------------- sr44
{
  const l = -17, f = 997;
  const r48 = run(tone(12, 48000, () => sineAmp(48000, f, l)), [11]).rows[0];
  const r44 = run(tone(12, 44100, () => sineAmp(44100, f, l)), [11]).rows[0];
  near(r48.loudS, l, 0.02, 'sr44: 48 kHz reads the target');
  near(r44.loudS, l, 0.02, 'sr44: 44.1 kHz reads the same target through the DERIVED coefficients');
  // and the same WAVEFORM (one amplitude) must read the same loudness at both rates to well under 0.1 LU
  const a = 0.2;
  const b48 = run(tone(12, 48000, () => a), [11]).rows[0].loudS, b44 = run(tone(12, 44100, () => a), [11]).rows[0].loudS;
  near(b44, b48, 0.02, 'sr44: one amplitude, two rates, the same LKFS');
}
// ---------------------------------------------------------------------------------------------------- determ
{
  const a = sineAmp(SR, 997, -11);
  const mk = () => run(tone(20, SR, (t) => a * (0.3 + 0.7 * Math.abs(Math.sin(t)))), [5, 10, 19]).rows;
  const A = JSON.stringify(mk()), Bq = JSON.stringify(mk());
  ok(A === Bq, 'determ: two runs are identical to the last bit');
}
// ---------------------------------------------------------------------------------------------------- cost
{
  const sig = tone(220, SR, () => 0.3);
  const lo = new Loud(SR), bl = new Float32Array(B), br = new Float32Array(B);
  const nb = Math.floor(sig.L.length / B);
  const t0 = process.hrtime.bigint();
  for (let s = 0, k = 0; k < nb; k++, s += B) { bl.set(sig.L.subarray(s, s + B)); br.set(sig.R.subarray(s, s + B)); lo.push(bl, br, s / SR); }
  const us = Number(process.hrtime.bigint() - t0) / 1000 / nb;
  const perFrame = us * (SR / B) / 60;
  console.log(`cost: ${us.toFixed(2)} µs/block over ${nb} blocks -> ${perFrame.toFixed(2)} µs/frame at 48 kHz / 60 fps ` +
    `(${(100 * perFrame / 16666.7).toFixed(3)} % of a 60 fps frame)`);
  ok(perFrame < 40, `cost: ${perFrame.toFixed(2)} µs/frame, under the 40 µs budget`);
}

// ====================================================================================================== --truth
// Phase 3: the engine against the offline reference, and the truth-graded breakdown -> drop ratios.
//
// TWO references, because they answer different questions:
//  (a) an EXACT in-test one, on the same 48 kHz dump the stage is fed: the same K-weighting coefficients (pinned to the
//      spec table by `coef48` above, and independently re-derived in python to 9e-16), but a straight whole-file
//      cumulative sum in Float64 with NO ring, NO block quantisation and NO interpolation. This is what grades the
//      engine's machinery — the ring, `cumAt`'s interpolation, the heard-time read — frame by frame, to 0.1 LU.
//  (b) tools/truth/<name>.loud.json, python's own implementation, which ran at the FILE's rate (44.1 kHz) while the
//      stage runs on the 48 kHz resample. The two signals are not the same samples, so a per-frame gate on it would be
//      grading `resample_poly`; it is reported, and gated only on the 3 s window (insensitive to resampling) and on the
//      aggregate numbers (the integrated loudness and every drop pair's dLU), which is the real cross-implementation check.
function exactRef(raw, n, sr) {
  const kl = new KChainRef(kcoef(sr)), kr = new KChainRef(kcoef(sr)), cs = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) {
    const a = kl.step(raw[2 * i]), b = kr.step(raw[2 * i + 1]);
    cs[i + 1] = cs[i] + a * a + b * b;
  }
  return (t, W) => {
    const i1 = Math.min(n, Math.max(0, Math.round(t * sr))), i0 = Math.min(n, Math.max(0, i1 - Math.round(W * sr)));
    if (i1 - i0 < Math.round(W * sr)) return null;                 // not a full window: not graded
    const z = (cs[i1] - cs[i0]) / (i1 - i0);
    return z > 0 ? LOUD_OFS + 10 * Math.log10(z) : null;
  };
}
class KChainRef {   // the same two biquads, written the obvious way (arrays, direct form I) — a second spelling of the filter
  constructor(c) { this.c = c; this.x = [[0, 0], [0, 0]]; this.y = [[0, 0], [0, 0]]; }
  step(v) {
    for (let k = 0; k < 2; k++) {
      const b = k ? this.c.hp : this.c.shelf, x = this.x[k], y = this.y[k];
      const o = b[0] * v + b[1] * x[0] + b[2] * x[1] - b[3] * y[0] - b[4] * y[1];
      x[1] = x[0]; x[0] = v; y[1] = y[0]; y[0] = o; v = o;
    }
    return v;
  }
}
if (process.argv.includes('--truth')) {
  const TRACKS = ['SeeYouDrop', 'CyborgNinja', 'Malicious', 'WhoLikesToParty', 'Vienna'];
  const LOUDDIR = { Vienna: 'tools/work' };                     // Vienna's reference lives outside tools/truth (another worker owns that folder)
  const FPS = 60, TOL = 0.02, PY_TOL_S = 0.4, WARM = 8;
  console.log('\n--truth: the stage against (a) an exact in-test reference on the same samples and (b) python\'s');
  let graded = 0, pairsOk = 0, pairsN = 0;
  for (const name of TRACKS) {
    const pcm = path.join(ROOT, 'tools/work', name + '.48000.st.f32');
    const lj = path.join(ROOT, LOUDDIR[name] || 'tools/truth', name + '.loud.json');
    if (!fs.existsSync(pcm) || !fs.existsSync(lj)) { console.log(`skip ${name}: ${fs.existsSync(pcm) ? 'no .loud.json' : 'no PCM dump (trackmap.py --pcm --sr=48000)'}`); continue; }
    const meta = JSON.parse(fs.readFileSync(pcm + '.json', 'utf8')), sr = meta.sr;
    const raw = new Float32Array(fs.readFileSync(pcm).buffer, 0, meta.n * 2);
    const REF = JSON.parse(fs.readFileSync(lj, 'utf8'));
    const ex = exactRef(raw, meta.n, sr);
    const hop = REF.contour.hop, cm = REF.contour.mom, cps = REF.contour.short;
    const pyAt = (c, t) => { const i = Math.round(t / hop); return i >= 0 && i < c.length ? c[i] : null; };
    const lo = new Loud(sr), bl = new Float32Array(B), br = new Float32Array(B), o = {};
    const rows = [];
    let eM = 0, eS = 0, nE = 0, pM = 0, pS = 0, nP = 0, nextF = 0;
    for (let s = 0; s + B <= meta.n; s += B) {
      for (let i = 0; i < B; i++) { bl[i] = raw[2 * (s + i)]; br[i] = raw[2 * (s + i) + 1]; }
      const t0 = s / sr;
      lo.push(bl, br, t0);
      const tEnd = t0 + B / sr;
      while (nextF / FPS <= tEnd) {                              // one read per 60 fps frame, as the page does
        const t = nextF / FPS; nextF++;
        lo.read(t, o);
        rows.push({ t, S: o.loudS, Pk: o.loudPk, rel: o.loudRel, rg: o.loudRange });
        if (t < WARM) continue;
        const xm = ex(t, MOM_W), xs = ex(t, SHORT_W);
        if (xm !== null && xs !== null) { eM = Math.max(eM, Math.abs(o.loudM - xm)); eS = Math.max(eS, Math.abs(o.loudS - xs)); nE++; }
        const qm = pyAt(cm, t), qs = pyAt(cps, t);
        if (qm !== null && qs !== null) { pM = Math.max(pM, Math.abs(o.loudM - qm)); pS = Math.max(pS, Math.abs(o.loudS - qs)); nP++; }
      }
    }
    const p = (v, q) => { const a = v.slice().sort((x, y) => x - y); return a[Math.min(a.length - 1, Math.floor(q / 100 * a.length))]; };
    const win = (a, b, f) => rows.filter((r) => r.t >= a && r.t < b).map(f);
    console.log(`\n${name} (${(meta.n / sr).toFixed(1)} s, ${sr} Hz, ${rows.length} frames, ${nE} graded):`);
    console.log(`  (a) exact, same samples:  max |loudM - ref| ${eM.toFixed(4)} LU · max |loudS - ref| ${eS.toFixed(4)} LU`);
    console.log(`  (b) python at ${REF.sr} Hz:   max |loudM - ref| ${pM.toFixed(3)} LU · max |loudS - ref| ${pS.toFixed(3)} LU ` +
      `(the 44.1 -> 48 kHz resample is in this number)`);
    console.log(`  loudRange p50 ${p(win(WARM, 1e9, (r) => r.rg), 50).toFixed(2)} LU against the reference's whole-track p95-p10 ${REF.short.range.toFixed(2)}`);
    ok(eM <= TOL && eS <= TOL, `${name}: within ${TOL} LU of the exact reference on all ${nE} graded frames (the ring, the sub-block edge, the heard-time read)`);
    ok(pS <= PY_TOL_S, `${name}: within ${PY_TOL_S} LU of python's 3 s window across the resample`);
    graded++;
    for (const pr of REF.pairs) {
      const b = pr.before, a = pr.after;
      const sB = p(win(b.t0, b.t1, (r) => r.S), 50), sA = p(win(a.t0, a.t1, (r) => r.S), 50);
      const rB = p(win(b.t0, b.t1, (r) => r.rel), 50), rA = p(win(a.t0, a.t1, (r) => r.rel), 50);
      const good = sA > sB, agree = Math.abs((sA - sB) - pr.d_lu_short) <= 0.05;
      pairsN++; if (good) pairsOk++;
      console.log(`  drop ${pr.drop.toFixed(2)}: loudS p50 ${sB.toFixed(2)} -> ${sA.toFixed(2)} = ${(sA - sB >= 0 ? '+' : '') + (sA - sB).toFixed(2)} LU ` +
        `(x${Math.pow(10, (sA - sB) / 10).toFixed(3)} in power; the truth says ${pr.d_lu_short >= 0 ? '+' : ''}${pr.d_lu_short.toFixed(2)}${agree ? '' : '  DISAGREE'}) · ` +
        `loudRel p50 ${rB.toFixed(3)} -> ${rA.toFixed(3)} = x${(rA / Math.max(rB, 1e-9)).toFixed(3)}${good ? '' : '   MISS'}`);
      ok(agree, `${name} drop ${pr.drop.toFixed(2)}: the stage's dLU agrees with the truth's to 0.05 LU`);
    }
    if (!REF.pairs.length) console.log('  no drops in the truth — the control: nothing may claim one');
  }
  ok(graded >= 4, `--truth: ${graded} tracks graded against the reference`);
  // Malicious's drop at 148.29 s is the ONE recorded exception: its 5.1 s short-term p50 reads -0.20 LU while the
  // window-integrated loudness says +1.17 (phase 1's commit) — its "breakdown" is already loud. Every other pair must rise.
  ok(pairsOk >= pairsN - 1, `--truth: ${pairsOk} of ${pairsN} truth drops read LOUDER than the breakdown before them (1 recorded exception: Malicious 148.29 s)`);
}

console.log(`\ntest_loud: ${fail ? 'FAIL ' + fail + ' of ' + (pass + fail) : 'OK ' + pass + ' pass'}`);
process.exit(fail ? 1 : 0);
