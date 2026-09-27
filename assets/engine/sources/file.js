// A FILE SOURCE (v0.15 E1): a real track as the engine's input, decoded locally, in two modes.
//
//  · REAL TIME (a real window, or headless without the deterministic clock): an AudioBufferSourceNode into AU.bus AND
//    into ctx.destination — AUDIBLE. Capture mode mutes because the other tab is already heard; a file has no other
//    voice, so it must be heard. The existing AnalyserNodes and the synapse worklet see it through the bus, unchanged.
//
//  · DETERMINISTIC (window.__FRAME exists — tools/cdp.js CLOCK=1 — unless &det=0; &det=1 forces it): NOTHING is played,
//    because the clock is not real time. The playhead is frame-exact, AU.fast / AU.slow become PCM-backed shims
//    (engine/shim.js) over the decoded mono ending at it, and the synapse tap is fed exact 512-sample blocks on the main
//    thread BEFORE the synapse stage runs. Two runs of the same window give byte-identical per-frame MS.
//    features.js, features-slow.js, tempo.js and synapse/{analyzer,anatomy,dsp,structure}.js are untouched: they see the
//    shims and the pushed blocks and cannot tell.
//
// Determinism debt this module pays off from outside itself: features-slow.js:125 seeds a NEW section's look with
// Math.random() (MS.seed.hue/th/a → LOOK, GROOVE and several scenes), and features-slow.js may not be edited this
// session. In deterministic mode the source therefore installs a seeded PRNG over Math.random for the life of the run and
// restores the original on stop — the same kind of shim CLOCK=1 is for requestAnimationFrame. Without it the MS trace is
// identical but a screenshot of a real track is not (a section boundary re-rolls the palette). docs/workers/file.md §audit.
import { AU, initAudio, run, stopAll } from '../audio.js';
import { makeAnalyser } from '../shim.js';
import { PCM } from '../pcm.js';
import { TAPS } from '../synapse/tap.js';
import { pushLog } from '../trace.js';

export const FPS = 60;               // the deterministic clock's rate (tools/cdp.js CLOCK_SHIM: t = frame·1000/60)
export const HOP = 512;              // the synapse tap's block size (synapse/tap.js WORKLET_SRC)
// DET_LEAD (s): how far AHEAD of the listener the analysers look in a real window — the output latency the deterministic
// playhead has to model, so heardT = playhead − DET_LEAD is the same quantity in both modes. MEASURED on this machine
// (docs/workers/file.md §latency): AudioContext.outputLatency is 0 headless and 0 headed under PulseAudio's null sink, and
// getOutputTimestamp().contextTime tracks currentTime to within a render quantum, so the honest value here is 0 — a
// number invented from a spec table would make heardT wrong by exactly itself. Re-measure on a machine with real output.
// MEASURED headless on this machine, 48 kHz (docs/workers/file.md §latency; 1478 frames of a real-time file run):
// outputLatency median 0.040 s (it moves in steps, 0.032–0.048), render quantum 128/48000 = 0.00267 s, so the brief's
// recipe gives 0.0427 — and the quantity it models, ctx.currentTime − ctxHeard() (how far ahead of the listener the
// analysers look), measures 0.0454 median / 0.0504 p90 in the same run. 0.0427 is the number below; the 3 ms it differs
// from the direct measurement is the getOutputTimestamp extrapolation. Re-measure per machine: outputLatency is the
// audio device's, not ours (ITU-R BT.1359's 45 ms detectability threshold is uncomfortably close to both numbers).
export const DET_LEAD = 0.0427;
const DET_HOLD_FRAME = 1;            // the deterministic clock is held here while the track decodes (see holdClock below)
const MUSIC_URL = '/music/';         // tools/serve.js, from $MUSIC (default ~/Music/RetinaRave) — local only, never shipped
const START_DELAY = 0.06;            // s of context time before the buffer node starts, so startCtxTime is not already past
const DET_SEED = 0x9e3779b9;         // the seeded PRNG's seed (see the note above); any fixed value, named so it is not magic
const END_EPS = 1e-6;

// det by default when the deterministic clock is present. One window read, for detection only.
const DET_AUTO = typeof window !== 'undefined' && window.__FRAME !== undefined;

let node = null;                     // the AudioBufferSourceNode (real-time mode only)
let realAn = null;                   // { fast, slow } — the AnalyserNodes the shims replaced
let realRandom = null;               // the Math.random the seeded PRNG replaced
let blkM = null, blkL = null, blkR = null;
let detMs = 0;                       // the frame clock's ms this frame (the tap's injected clock in deterministic mode)

// mulberry32: 32 bits of state, uniform enough for a look seed and identical on every run.
function seededRandom(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Hold / release tools/cdp.js's deterministic clock (a no-op when the shim is not there).
function holdClock(on) {
  if (typeof window === 'undefined' || window.__FRAME === undefined) return;
  if (on) window.__pauseAt = DET_HOLD_FRAME;
  else { window.__pauseAt = 0; window.__PAUSE = 0; }
}

const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const frameOf = (nowMs) => Math.round(nowMs * FPS / 1000); // the deterministic clock's frame from the rAF timestamp

// start(src[, opt]). src: a track name served from /music/ · an ArrayBuffer · a File / Blob (the landing control).
// opt: { at: track second to start at, det: force/forbid deterministic mode, sync: capture offset ms, msg: landing text }.
export async function startFile(src, opt = {}) {
  initAudio();
  const ctx = AU.ctx;
  teardown();
  if (opt.sync !== undefined && isFinite(+opt.sync)) AU.sync = +opt.sync / 1000;
  const det = opt.det === undefined ? DET_AUTO : !!opt.det;
  // Deterministic mode: hold the frame clock at DET_HOLD_FRAME until the track is decoded, so frame0 is the SAME frame on
  // every run. Without it the page runs however many frames the decode happens to take (hundreds, and a different number
  // each time) before the playhead starts, and core/loop.js's `wall` — which advances even on silence — has accumulated a
  // different amount: the MS trace would still match frame for frame but a screenshot of a real track would not.
  // window.__pauseAt / __PAUSE are tools/cdp.js's CLOCK=1 shim; on a page without it this is two harmless properties.
  holdClock(det);
  const name = typeof src === 'string' ? src : (src && src.name) || 'file';
  const F = AU.file = {
    name, sr: ctx.sampleRate, n: 0, dur: 0, L: null, R: null, mono: null,
    at: Math.max(0, +(opt.at || 0) || 0), det, ready: false, gates: [],
    open: false, frame0: -1, ph: 0, ctx0: 0, pushed: 0, ended: false, err: null,
    playhead: () => F.ph,
    heardT: () => heardTOf(F),
  };
  F.ph = F.at;
  run('file', opt.msg);
  AU.stopFile = teardown;
  let buf = null;
  try {
    let ab;
    if (typeof src === 'string') {
      const r = await fetch(MUSIC_URL + encodeURIComponent(src));
      if (!r.ok) throw new Error('/music/ ' + r.status);
      ab = await r.arrayBuffer();
    } else if (src instanceof ArrayBuffer) ab = src;
    else if (src && src.arrayBuffer) ab = await src.arrayBuffer();
    else throw new Error('no source');
    buf = await ctx.decodeAudioData(ab);
  } catch (e) {
    F.err = String((e && e.message) || e);
    run('demo', 'That track could not be played (' + F.err + ') — running the demo signal.');
    return F;
  }
  if (AU.file !== F) return F;                      // another source started while we decoded
  F.sr = buf.sampleRate;                            // === ctx.sampleRate: decodeAudioData resamples to the context rate
  F.n = buf.length;
  F.dur = buf.duration;
  F.L = buf.getChannelData(0);
  F.R = buf.numberOfChannels > 1 ? buf.getChannelData(1) : F.L;
  F.mono = downmix(F.L, F.R);                       // (L + R)/2 — the tap's downmix, and the AnalyserNode's, exactly
  F.buf = buf;
  F.ready = true;
  if (F.gates.length) { try { await Promise.all(F.gates.slice()); } catch (e) {} }
  if (AU.file !== F) return F;
  if (det) armDet(F);
  F.open = true;                                    // the next frame starts the playhead
  holdClock(false);                                 // let the deterministic clock run: the next frame is frame0
  return F;
}

// (L + R)/2 into its own array: the shims and the tap read mono, the PCM bus reads the two channels.
function downmix(L, R) {
  const n = L.length, m = new Float32Array(n);
  if (L === R) { m.set(L); return m; }
  for (let i = 0; i < n; i++) m[i] = (L[i] + R[i]) * 0.5;
  return m;
}

// Deterministic mode: shims in place of the AnalyserNodes, the worklet taps silenced, the PCM bus fed locally, a seeded
// Math.random. Everything here is undone by teardown().
function armDet(F) {
  realAn = { fast: AU.fast, slow: AU.slow };
  AU.fast = makeAnalyser(realAn.fast.fftSize, realAn.fast.smoothingTimeConstant);
  AU.slow = makeAnalyser(realAn.slow.fftSize, realAn.slow.smoothingTimeConstant);
  AU.fast.setSource(F.mono, F.sr);
  AU.slow.setSource(F.mono, F.sr);
  for (const t of TAPS) { t.mute(true); t.clock = () => detMs; } // the worklet hears the silent bus: its zeros are a lie
  PCM.local = true;
  PCM.detach();
  PCM.map = null;
  PCM.reset();
  blkM = new Float32Array(HOP);
  blkL = new Float32Array(HOP);
  blkR = new Float32Array(HOP);
  if (!realRandom) { realRandom = Math.random; Math.random = seededRandom(DET_SEED); }
}

// Real-time mode: the buffer node, audible, from F.at.
function startBuffer(F) {
  const ctx = AU.ctx;
  node = ctx.createBufferSource();
  node.buffer = F.buf;
  node.connect(AU.bus);
  node.connect(ctx.destination);                    // audible — the one thing capture mode must not do and this must
  const t0 = ctx.currentTime + START_DELAY;
  node.start(t0, F.at);
  F.ctx0 = t0;
  PCM.map = (ctxT) => clamp(F.at + (ctxT - F.ctx0), 0, F.dur);  // the bus's blocks are stamped in TRACK seconds
  PCM.arm(ctx, AU.bus);
}

// The audio time the listener hears at this frame, in the file's own base (track seconds).
function heardTOf(F) {
  if (F.det) return clamp(F.ph - DET_LEAD, 0, F.dur);
  if (F.frame0 < 0) return F.at;
  return clamp(F.at + (AU.ctxHeard() - F.ctx0), 0, F.dur);
}

// Per rendered frame, from ENGINE.frame BEFORE updateMusic and therefore before the synapse stage.
export function tickFile(nowMs) {
  const F = AU.file;
  if (!F || AU.mode !== 'file') return;
  if (F.frame0 < 0) {
    if (!F.open) return;
    F.frame0 = F.det ? frameOf(nowMs) : 0;
    F.pushed = Math.floor(F.at * F.sr / HOP) * HOP;
    if (!F.det) startBuffer(F);
    pushLog('fileStart', F.at, F.frame0, { frame0: F.frame0, sr: F.sr, at: F.at, det: F.det, dur: F.dur, name: F.name });
  }
  if (F.det) {
    detMs = nowMs;                                  // the tap's lead is measured on this, not on the wall clock
    F.ph = clamp(F.at + (frameOf(nowMs) - F.frame0) / FPS + DET_LEAD, 0, F.dur);
    const end = Math.min(F.n, Math.round(F.ph * F.sr));
    AU.fast.seek(end);
    AU.slow.seek(end);
    while (F.pushed + HOP <= end) {                 // exact, contiguous blocks up to the playhead — 1 or 2 per frame
      const p = F.pushed;
      blkM.set(F.mono.subarray(p, p + HOP));
      for (const t of TAPS) t.pushBlock(blkM, nowMs);
      if (PCM.fns.length) {
        blkL.set(F.L.subarray(p, p + HOP));
        blkR.set(F.R.subarray(p, p + HOP));
        PCM.push(blkL, blkR, p / F.sr);
      }
      F.pushed = p + HOP;
    }
  } else F.ph = clamp(F.at + (AU.ctx.currentTime - F.ctx0), 0, F.dur);
  if (!F.ended && F.ph >= F.dur - END_EPS) {
    F.ended = true;
    pushLog('fileEnd', F.dur, F.det ? frameOf(nowMs) : 0, { dur: F.dur, name: F.name });
  }
}

// Undo everything armDet / startBuffer did. Idempotent: audio.js's stopAll calls it through AU.stopFile.
export function teardown() {
  holdClock(false);
  if (node) {
    try { node.stop(); } catch (e) {}
    try { node.disconnect(); } catch (e) {}
    node = null;
  }
  if (realAn) { AU.fast = realAn.fast; AU.slow = realAn.slow; realAn = null; }
  if (realRandom) { Math.random = realRandom; realRandom = null; }
  for (const t of TAPS) { t.mute(false); t.clock = () => performance.now(); }
  PCM.local = false;
  PCM.map = null;
  PCM.attach();
}

export function stopFile() {
  teardown();
  stopAll();
}

export default { name: 'file', start: startFile, stop: stopFile, tick: tickFile };
