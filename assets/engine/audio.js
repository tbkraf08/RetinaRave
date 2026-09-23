// AudioContext graph: bus -> two AnalyserNodes (2048 fast, 8192 slow) -> muted sink. Sources plug into AU.bus.
// No DOM: UI reactions to run/stop go through AU.onRun / AU.onStop hooks set by core/hud.js.
// Lifted from cardioid3 "AUDIO".

export const AU = {
  ctx: null, fast: null, slow: null, bus: null, capAn: null, stream: null, demo: null,
  mode: 'none', heard: false, t0: 0, capBuf: null,
  onInit: [],           // fns(ctx) called once the context exists (features.js registers setupBins)
  onRun: null,          // fn(mode, msg) — UI hook
  onStop: null,         // fn(msg) — UI hook
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
  for (const f of AU.onInit) f(ctx);
}

// Switch the live source. mode: 'demo' | 'capture' | 'none'.
export function run(mode, msg) {
  AU.mode = mode;
  AU.heard = false;
  AU.t0 = performance.now();
  if (mode === 'demo') AU.startDemo && AU.startDemo();
  else if (AU.demo) AU.demo.out.gain.value = 0;
  AU.onRun && AU.onRun(mode, msg);
}

export function stopAll() {
  if (AU.stream) {
    AU.stream.getTracks().forEach((t) => t.stop());
    AU.stream = null;
  }
  AU.mode = 'none';
  AU.capAn = null;
  if (AU.demo) AU.demo.out.gain.value = 0;
  AU.onStop && AU.onStop('Sharing ended.');
}
