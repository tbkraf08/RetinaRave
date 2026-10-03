// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// AudioContext graph: bus -> two AnalyserNodes (2048 fast, 8192 slow) -> muted sink. Sources plug into AU.bus.
// No DOM: UI reactions to run/stop go through AU.onRun / AU.onStop hooks set by core/hud.js.
// Lifted from cardioid3 "AUDIO".
import { PCM } from './pcm.js';

export const AU = {
  ctx: null, fast: null, slow: null, bus: null, capAn: null, stream: null, demo: null,
  mode: 'none', heard: false, t0: 0, capBuf: null,
  file: null,           // v0.15 E1: sources/file.js's state while a file is the source (null otherwise)
  stopFile: null,       // v0.15 E1: sources/file.js's teardown, so stopAll can undo the file graph without importing it
  sync: 0,              // v0.15 E2: SYNC_OFS (s) — the declared capture-path lag added to heardT in capture / mic mode
  onFile: [],           // fns(F) called when a file source starts, before its decode (features-ears.js arms the map gate)
  onInit: [],           // fns(ctx) called once the context exists (features.js registers setupBins)
  onRun: null,          // fn(mode, msg) — UI hook
  onStop: null,         // fn(msg) — UI hook

  // v0.15 E2 — THE ENGINE'S TIME BASE ("audio time", s). File modes: TRACK time (the second of the file). Live modes:
  // AU.ctx time. Every PCM block's t0, every event onset and heardT are in this base (docs/ENGINE.md).
  //
  // ctxHeard(): the context time of the sample the listener hears at this frame. getOutputTimestamp().contextTime is
  // already the sample being played out (it lags ctx.currentTime by the output path), extrapolated here to this frame's
  // performance.now() with performanceTime; the fallback subtracts outputLatency from currentTime, which is what
  // contextTime means. The brief's formula subtracted outputLatency from contextTime as well — measured, that
  // double-counts (docs/workers/file.md §latency reports both numbers).
  ctxHeard() {
    const ctx = AU.ctx;
    if (!ctx) return 0;
    const ts = ctx.getOutputTimestamp ? ctx.getOutputTimestamp() : null;
    if (ts && Number.isFinite(ts.contextTime) && Number.isFinite(ts.performanceTime) && ts.contextTime > 0)
      return ts.contextTime + (performance.now() - ts.performanceTime) / 1000;
    return ctx.currentTime - (ctx.outputLatency || 0);
  },

  // The audio time the listener hears at THIS frame, in the engine's time base. −1 with no audio context / no source.
  heardT() {
    if (AU.mode === 'file' && AU.file) return AU.file.heardT();
    if (!AU.ctx || AU.mode === 'none') return -1;
    // capture / mic: the sound was heard before it reached us — the capture path's lag is what the harness measures and
    // SYNC_OFS declares. demo: our own synth, so the output path is the whole of it, as real-time file.
    return AU.mode === 'capture' || AU.mode === 'mic' ? AU.ctx.currentTime + AU.sync : AU.ctxHeard();
  },

  // The latency numbers a report has to quote, from one place (docs/HARNESS.md "File source").
  lat() {
    const ctx = AU.ctx;
    if (!ctx) return null;
    const ts = ctx.getOutputTimestamp ? ctx.getOutputTimestamp() : null;
    return { rate: ctx.sampleRate, base: ctx.baseLatency, out: ctx.outputLatency, now: ctx.currentTime,
      ctxT: ts ? ts.contextTime : null, perfT: ts ? ts.performanceTime : null, heard: AU.ctxHeard(), state: ctx.state };
  },
};

export function initAudio() {
  if (AU.ctx) return;
  const C = window.AudioContext || window.webkitAudioContext;
  const ctx = new C({ latencyHint: 'interactive' });
  AU.ctx = ctx;
  AU.bus = ctx.createGain();
  AU.fast = ctx.createAnalyser();
  AU.fast.fftSize = 2048;
  AU.fast.smoothingTimeConstant = 0;
  AU.slow = ctx.createAnalyser();
  AU.slow.fftSize = 8192;
  AU.slow.smoothingTimeConstant = 0.3;
  AU.bus.connect(AU.fast);
  AU.bus.connect(AU.slow);
  const mute = ctx.createGain();
  mute.gain.value = 0;
  AU.fast.connect(mute);
  AU.slow.connect(mute);
  mute.connect(ctx.destination);
  ctx.resume && ctx.resume();
  PCM.arm(ctx, AU.bus); // v0.15: the PCM bus's live feeder — it builds nothing until a stage subscribes
  for (const f of AU.onInit) f(ctx);
}

// Switch the live source. mode: 'demo' | 'capture' | 'mic' | 'file' | 'none'.
export function run(mode, msg) {
  AU.mode = mode;
  AU.heard = false;
  AU.t0 = performance.now();
  if (mode === 'demo') AU.startDemo && AU.startDemo();
  else if (AU.demo) AU.demo.out.gain.value = 0;
  AU.onRun && AU.onRun(mode, msg);
}

export function stopAll() {
  const was = AU.mode;
  if (AU.stream) {
    AU.stream.getTracks().forEach((t) => t.stop());
    AU.stream = null;
  }
  if (AU.stopFile) AU.stopFile(); // v0.15: the buffer node, the analyser shims and the seeded PRNG go with the source
  AU.file = null;
  AU.mode = 'none';
  AU.capAn = null;
  if (AU.demo) AU.demo.out.gain.value = 0;
  AU.onStop && AU.onStop(was === 'mic' ? 'Microphone stopped.' : 'Sharing ended.');
}
