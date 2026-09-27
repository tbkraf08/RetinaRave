// The PCM-backed AnalyserNode shims (assets/engine/shim.js) against the Web Audio spec's own formulas, computed here a
// second way (a naive DFT, the smoothing recurrence written out, the byte scaling written out) so a mistake has to be made
// twice to pass. Also the two Chrome behaviours the shims copy: one analysis per distinct render quantum (so reads at the
// same playhead are identical and the smoothing advances once), and a playhead floored to a whole quantum.
//   node tools/test_shim.js          (add PCM=1 to also run the real SeeYouDrop dump from tools/truth/trackmap.py --pcm)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeAnalyser, SHIM } from '../assets/engine/shim.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const Q = SHIM.QUANTUM, ALPHA = SHIM.BLACKMAN_A;
let bad = 0;
const ok = (cond, msg, extra = '') => { if (!cond) { bad++; console.log('FAIL', msg, extra); } else console.log('ok  ', msg, extra); };

// --- a deterministic test signal: three partials, a DC offset and reproducible noise ---
const SR = 48000, N_SIG = 40000;
const sig = new Float32Array(N_SIG);
let rng = 12345;
const rand = () => { rng = (rng * 1103515245 + 12345) & 0x7fffffff; return rng / 0x7fffffff * 2 - 1; };
for (let i = 0; i < N_SIG; i++) {
  const t = i / SR;
  sig[i] = 0.5 * Math.sin(2 * Math.PI * 440 * t) + 0.22 * Math.sin(2 * Math.PI * 3150 * t + 0.7)
    + 0.08 * Math.sin(2 * Math.PI * 61 * t) + 0.03 + 0.05 * rand();
}

// The spec's Blackman window, written out again.
const win = (n, N) => (1 - ALPHA) / 2 - 0.5 * Math.cos(2 * Math.PI * n / N) + (ALPHA / 2) * Math.cos(4 * Math.PI * n / N);

// The spec's analysis, by a naive DFT: window the last N samples ending at `end`, |X[k]|/N, then 20·log10 (−1000 at 0).
function dftDb(pcm, end, N) {
  const out = new Float64Array(N >> 1);
  const x = new Float64Array(N);
  for (let i = 0; i < N; i++) { const s = end - N + i; x[i] = (s >= 0 && s < pcm.length ? pcm[s] : 0) * win(i, N); }
  for (let k = 0; k < N >> 1; k++) {
    let re = 0, im = 0;
    for (let i = 0; i < N; i++) { const a = -2 * Math.PI * k * i / N; re += x[i] * Math.cos(a); im += x[i] * Math.sin(a); }
    const m = Math.sqrt(re * re + im * im) / N;
    out[k] = m > 0 ? 20 * Math.log10(m) : SHIM.DB_ZERO;
  }
  return out;
}
const maxAbs = (a, b) => { let m = 0; for (let i = 0; i < a.length; i++) m = Math.max(m, Math.abs(a[i] - b[i])); return m; };

// === 1. the float spectrum against the DFT, τ = 0, at three playheads (one of them mid-quantum, one before the start) ===
for (const N of [512, 2048]) {
  for (const end of [4096, 4096 + 73, 256]) {
    const A = makeAnalyser(N, 0);
    A.setSource(sig, SR);
    A.seek(end);
    const got = new Float32Array(N >> 1);
    A.getFloatFrequencyData(got);
    const want = dftDb(sig, Math.floor(end / Q) * Q, N);   // the node only ever sees whole render quanta
    const d = maxAbs(got, want);
    ok(d < 1e-5, `fftSize ${N} end ${end}: |shim − DFT| max ${d.toExponential(2)} dB < 1e-5`);
  }
}

// === 2. the peak bin is where the partials are (the spectrum is not merely self-consistent) ===
{
  const N = 8192, A = makeAnalyser(N, 0);
  A.setSource(sig, SR);
  A.seek(20000);
  const d = new Float32Array(N >> 1);
  A.getFloatFrequencyData(d);
  let pk = 0;
  for (let k = 1; k < d.length; k++) if (d[k] > d[pk]) pk = k;
  const hz = pk * SR / N;
  ok(Math.abs(hz - 440) < SR / N, `fftSize ${N}: the loudest bin is ${hz.toFixed(1)} Hz (the 440 Hz partial, bin width ${(SR / N).toFixed(2)})`);
}

// === 3. the smoothing recurrence X̂ = τ·X̂_prev + (1 − τ)·|X| ===
{
  const N = 1024, TAU = 0.6, ends = [3000, 3800, 4600, 5400];
  const A = makeAnalyser(N, TAU), B = makeAnalyser(N, 0);   // B gives the unsmoothed |X| at the same playheads
  A.setSource(sig, SR);
  B.setSource(sig, SR);
  const a = new Float32Array(N >> 1), b = new Float32Array(N >> 1), hat = new Float64Array(N >> 1);
  let worst = 0;
  for (const e of ends) {
    A.seek(e); B.seek(e);
    A.getFloatFrequencyData(a);
    B.getFloatFrequencyData(b);
    for (let k = 0; k < hat.length; k++) {
      const m = Math.pow(10, b[k] / 20);                      // |X[k]| back out of dB
      hat[k] = TAU * hat[k] + (1 - TAU) * m;
      worst = Math.max(worst, Math.abs((hat[k] > 0 ? 20 * Math.log10(hat[k]) : SHIM.DB_ZERO) - a[k]));
    }
  }
  ok(worst < 2e-4, `τ = ${TAU} over ${ends.length} analyses: |shim − recurrence| max ${worst.toExponential(2)} dB`);
}

// === 4. one analysis per distinct quantum: identical results at the same playhead, and τ advances once ===
{
  const N = 1024, A = makeAnalyser(N, 0.5);
  A.setSource(sig, SR);
  A.seek(4000);
  const a = new Float32Array(N >> 1), b = new Float32Array(N >> 1);
  A.getFloatFrequencyData(a);
  A.getFloatFrequencyData(b);                                  // second read, same playhead
  ok(maxAbs(a, b) === 0 && A.analyses === 1, 'two reads at one playhead: identical, one analysis', 'analyses=' + A.analyses);
  const restOfQuantum = Q - (4000 % Q) - 1;                    // 4000 sits inside quantum 31 (3968…4095)
  A.seek(4000 + restOfQuantum);                                // still inside it
  A.getFloatFrequencyData(b);
  ok(maxAbs(a, b) === 0 && A.analyses === 1, `a read inside the same quantum (+${restOfQuantum}): identical, still one analysis`);
  A.seek(4000 + restOfQuantum + 1);                            // a new quantum
  A.getFloatFrequencyData(b);
  ok(A.analyses === 2 && maxAbs(a, b) > 0, 'a read in the next quantum: a second analysis');
  const C = makeAnalyser(N, 0.5);                               // several quanta skipped in one step = ONE analysis (Blink)
  C.setSource(sig, SR);
  C.seek(4000); C.getFloatFrequencyData(a);
  C.seek(4000 + 6 * Q); C.getFloatFrequencyData(b);
  ok(C.analyses === 2, 'six quanta crossed in one step: still one further analysis (Blink\'s single dirty flag)', 'analyses=' + C.analyses);
}

// === 5. the byte variants, and the dB range ===
{
  const N = 1024, A = makeAnalyser(N, 0);
  A.setSource(sig, SR);
  A.seek(6000);
  const f = new Float32Array(N >> 1), u = new Uint8Array(N >> 1);
  A.getFloatFrequencyData(f);
  A.getByteFrequencyData(u);
  const lo = A.minDecibels, k255 = 255 / (A.maxDecibels - lo);
  let worst = 0;
  for (let k = 0; k < u.length; k++) {
    const want = Math.max(0, Math.min(255, Math.floor(k255 * (f[k] - lo))));
    worst = Math.max(worst, Math.abs(want - u[k]));
  }
  ok(worst === 0 && A.minDecibels === -100 && A.maxDecibels === -30, 'getByteFrequencyData = floor(255/(max−min)·(dB−min)) clamped, defaults −100/−30');
  const ft = new Float32Array(N), ut = new Uint8Array(N);
  A.getFloatTimeDomainData(ft);
  A.getByteTimeDomainData(ut);
  let wt = 0;
  for (let i = 0; i < N; i++) wt = Math.max(wt, Math.abs(Math.max(0, Math.min(255, Math.floor(128 * (1 + ft[i])))) - ut[i]));
  ok(wt === 0, 'getByteTimeDomainData = floor(128·(1+x)) clamped');
}

// === 6. the time domain is the last fftSize samples ending at the quantum-aligned playhead, zero before the start ===
{
  const N = 2048, A = makeAnalyser(N, 0);
  A.setSource(sig, SR);
  A.seek(5000 + 77);
  const td = new Float32Array(N), e = Math.floor((5000 + 77) / Q) * Q;
  A.getFloatTimeDomainData(td);
  let d = 0;
  for (let i = 0; i < N; i++) d = Math.max(d, Math.abs(td[i] - sig[e - N + i]));
  ok(d === 0 && A.endQ() === e, `getFloatTimeDomainData = sig[${e - N}..${e}) exactly`, 'endQ=' + A.endQ());
  A.seek(600);
  A.getFloatTimeDomainData(td);
  let zeros = 0, mism = 0;
  for (let i = 0; i < N; i++) { const s = 512 - N + i; if (s < 0) { if (td[i] !== 0) zeros++; } else if (td[i] !== sig[s]) mism++; }
  ok(zeros === 0 && mism === 0, 'a playhead inside the first fftSize samples: zeros before sample 0, samples after it');
}

// === 7. the shim is stateless across instances and deterministic: two runs of the same sequence agree bit for bit ===
{
  const seq = (A) => { const o = []; const d = new Float32Array(A.frequencyBinCount); for (let e = 2048; e < 20000; e += 800) { A.seek(e); A.getFloatFrequencyData(d); o.push(d[10], d[57], d[300]); } return o; };
  const a = makeAnalyser(2048, 0.3), b = makeAnalyser(2048, 0.3);
  a.setSource(sig, SR); b.setSource(sig, SR);
  const x = seq(a), y = seq(b);
  ok(JSON.stringify(x) === JSON.stringify(y), 'two shims, same sequence: bit-identical');
}

// === 8. the real track (opt-in: it needs tools/work/SeeYouDrop.f32 from trackmap.py --pcm) ===
{
  const f = path.join(ROOT, 'tools/work/SeeYouDrop.f32');
  if (process.env.PCM && fs.existsSync(f)) {
    const meta = JSON.parse(fs.readFileSync(f + '.json', 'utf8'));
    const buf = fs.readFileSync(f);
    const pcm = new Float32Array(buf.buffer, buf.byteOffset, buf.length / 4);
    const A = makeAnalyser(8192, 0.3);
    A.setSource(pcm, meta.sr);
    const d = new Float32Array(A.frequencyBinCount);
    let finite = true, pk = 0;
    for (let t = 30; t < 40; t += 0.5) { A.seek(Math.round(t * meta.sr)); A.getFloatFrequencyData(d); for (let k = 0; k < d.length; k++) if (!Number.isFinite(d[k])) finite = false; }
    for (let k = 1; k < d.length; k++) if (d[k] > d[pk]) pk = k;
    ok(finite, `SeeYouDrop.f32 (${meta.sr} Hz, ${(pcm.length / meta.sr).toFixed(1)} s) 30–40 s: every dB finite, loudest bin ${(pk * meta.sr / 8192).toFixed(1)} Hz`);
  } else console.log('skip  the real track (PCM=1 + tools/work/SeeYouDrop.f32 from `python3 tools/truth/trackmap.py SeeYouDrop --pcm`)');
}

console.log(bad ? 'FAIL ' + bad : 'OK');
process.exit(bad ? 1 : 0);
