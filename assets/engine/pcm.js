// THE PCM BUS (v0.15 E1): contiguous 512-sample STEREO blocks, each stamped with the audio time of its first sample.
// A stage that wants the samples themselves (the EARS stage) subscribes with PCM.on(fn); fn(L, R, t0) where L and R are
// Float32Array(512) and t0 is in the engine's time base (docs/ENGINE.md "Time": track seconds in file mode, AudioContext
// seconds in the live modes). Two feeders, never both at once:
//   · live (real-time file / capture / mic / demo): an AudioWorklet on AU.bus built from a Blob (as synapse/tap.js builds
//     its own, so dist/ still runs from file://). It posts { L, R, frame } every 512 samples, `frame` = the
//     AudioWorkletGlobalScope's `currentFrame` at the block's FIRST sample — sample-exact audio time, no clock guessing.
//     Created LAZILY on the first PCM.on: no listener, no worklet, nothing to measure.
//   · deterministic file mode: sources/file.js pushes the blocks itself, on the frame clock, from the decoded channels
//     (PCM.local = true keeps the worklet from ever being built — the bus is silent there and its zeros are a lie).
// Nothing here is per-frame work and nothing here writes MS.
const BLOCK = 512;
const CH = 2;                 // the worklet asks for stereo: channelCountMode 'explicit', channelCount 2
const WORKLET_NAME = 'pcm-bus';

// `currentFrame` is the frame index of the FIRST sample of this render quantum (Web Audio spec, AudioWorkletGlobalScope).
const WORKLET_SRC = `class PcmBus extends AudioWorkletProcessor {
  constructor(){ super(); this.L = new Float32Array(${BLOCK}); this.R = new Float32Array(${BLOCK}); this.n = 0; this.f = 0; }
  process(inputs){ const inp = inputs[0] || [], L = inp[0] || null, R = inp[1] || L, len = L ? L.length : 128;
    for (let i = 0; i < len; i++) { if (this.n === 0) this.f = currentFrame + i;
      this.L[this.n] = L ? L[i] : 0; this.R[this.n] = R ? R[i] : 0;
      if (++this.n === ${BLOCK}) { this.port.postMessage({ L: this.L.slice(0), R: this.R.slice(0), frame: this.f }); this.n = 0; } }
    return true; } }
registerProcessor(${JSON.stringify(WORKLET_NAME)}, PcmBus);`;

export const PCM = {
  BLOCK,
  fns: [],            // the listeners, in registration order
  ctx: null,          // the AudioContext and the node the live worklet taps (audio.js arms it on init)
  src: null,
  node: null,         // the AudioWorkletNode, once a listener asked for it
  zero: null,         // the silent sink the worklet's output needs to be pulled
  local: false,       // true in deterministic file mode: the source pushes, the worklet must not exist
  map: null,          // fn(ctxTime) -> engine time base; set by sources/file.js in real-time file mode (track seconds)
  blocks: 0,          // blocks delivered since the last reset (the tests count them)
  t0: -1,             // the last block's stamp (continuity checks)
  err: null,

  // Subscribe. Returns fn so a caller can PCM.off(fn) later.
  on(fn) {
    if (this.fns.indexOf(fn) < 0) this.fns.push(fn);
    this.attach();
    return fn;
  },
  off(fn) {
    const i = this.fns.indexOf(fn);
    if (i >= 0) this.fns.splice(i, 1);
  },

  // The live graph the worklet would tap. Called once from initAudio; attaching still waits for a listener.
  arm(ctx, src) {
    if (this.node && (ctx !== this.ctx || src !== this.src)) this.detach(); // a different graph: never leave a node connected
    this.ctx = ctx;
    this.src = src;
    this.attach();
  },

  // Build the worklet, at most once, and only when somebody is listening and the source is a real graph.
  async attach() {
    if (this.node || this._pending || this.local || !this.fns.length || !this.ctx || !this.src) return;
    if (!this.ctx.audioWorklet) { this.err = 'no audioWorklet'; return; }
    this._pending = true;
    try {
      const url = URL.createObjectURL(new Blob([WORKLET_SRC], { type: 'application/javascript' }));
      await this.ctx.audioWorklet.addModule(url);
      URL.revokeObjectURL(url);
      if (this.local || !this.fns.length) { this._pending = false; return; } // det mode started while we were loading
      const node = this.node = new AudioWorkletNode(this.ctx, WORKLET_NAME, {
        numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1], channelCount: CH, channelCountMode: 'explicit',
      });
      this.src.connect(node);
      const z = this.zero = this.ctx.createGain();
      z.gain.value = 0;
      node.connect(z).connect(this.ctx.destination); // a worklet with no pulled output is not processed
      node.port.onmessage = (e) => {
        const d = e.data, t = d.frame / this.ctx.sampleRate;
        this.push(d.L, d.R, this.map ? this.map(t) : t);
      };
    } catch (e) {
      this.err = String(e && e.message || e);
    }
    this._pending = false;
  },

  // Tear the live worklet down (deterministic mode takes over, or the page stops).
  detach() {
    if (this.node) {
      this.node.port.onmessage = null;
      try { this.src && this.src.disconnect(this.node); } catch (e) {}
      try { this.node.disconnect(); } catch (e) {}
    }
    this.node = null;
    this.zero = null;
  },

  // Deliver one block. t0 is already in the engine's time base.
  push(L, R, t0) {
    this.blocks++;
    this.t0 = t0;
    for (const f of this.fns) f(L, R, t0);
  },

  reset() { this.blocks = 0; this.t0 = -1; },
};
