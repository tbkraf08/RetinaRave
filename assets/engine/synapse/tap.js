// AudioWorklet tap: posts contiguous mono PCM in 512-sample blocks; the analyzer runs in the port handler, not in the
// render loop. Fallback: poll an AnalyserNode's time domain and append exactly the samples that are new.
// frame(dt) does the per-rendered-frame work: impulse decays, energy-integrated "musical time" (flow), beat-clock lead.
// Lifted from synapse2.html 497–522.
import { Analyzer } from './analyzer.js';

const WORKLET_SRC = `class Tap extends AudioWorkletProcessor { constructor(){ super(); this.b = new Float32Array(512); this.n = 0; }
  process(inputs){ const inp = inputs[0]; if (inp && inp.length) { const L = inp[0], R = inp[1] || L, b = this.b; for (let i = 0; i < L.length; i++) { b[this.n++] = (L[i] + R[i]) * 0.5; if (this.n === 512) { this.port.postMessage(b.slice(0)); this.n = 0; } } } return true; } }
registerProcessor('synapse-tap', Tap);`;

// Every Tap ever built. sources/file.js reaches the live one through this in deterministic mode (engine/sources/ may
// not import features-synapse.js, which owns the instance — that edge would close a cycle through engine.js).
export const TAPS = [];

export class Tap {
  constructor() {
    this.an = null;
    this.mode = 'none';
    this.lastPush = 0;
    this.ctx = null;
    // v0.15 E1: the clock `lastPush` and the beat-clock lead are measured on. In deterministic file mode the caller
    // passes the frame clock's ms to pushBlock, so `lead` is a function of the frame and not of the wall clock.
    this.clock = () => performance.now();
    this.silent = false;
    this.preMode = undefined;
    TAPS.push(this);
  }

  // v0.15 E1: deterministic file mode. The worklet is still attached to the (silent) bus and still posts in real time —
  // its zero blocks must never reach the Analyzer, so the port handler drops them while this is set, and the analyser
  // fallback stops polling. `mode` is pinned to 'worklet' because frame()'s beat-clock lead reads it and the frame
  // attach() flips it on is a function of the wall clock, not of the music (docs/workers/file.md §determinism).
  mute(on) {
    this.silent = !!on;
    if (on) { if (this.preMode === undefined) this.preMode = this.mode; this.mode = 'worklet'; }
    else if (this.preMode !== undefined) { this.mode = this.node ? 'worklet' : this.fall ? 'analyser' : this.preMode; this.preMode = undefined; }
  }

  // v0.15 E1: push one exact 512-sample block on the main thread, with the clock's ms for the beat-clock lead.
  pushBlock(b, ms) {
    if (!this.an) return;
    this.lastPush = ms;
    this.an.push(b);
  }
  async attach(ctx, source) {
    this.ctx = ctx;
    this.an = new Analyzer(ctx.sampleRate);
    try {
      if (!ctx.audioWorklet) throw 0;
      const url = URL.createObjectURL(new Blob([WORKLET_SRC], { type: 'application/javascript' }));
      await ctx.audioWorklet.addModule(url);
      const node = this.node = new AudioWorkletNode(ctx, 'synapse-tap', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1], channelCount: 2, channelCountMode: 'explicit' });
      source.connect(node);
      const z = ctx.createGain();
      z.gain.value = 0;
      node.connect(z).connect(ctx.destination);
      node.port.onmessage = (e) => {
        if (this.silent) return; // deterministic file mode: the bus is silent and the source pushes the real blocks
        this.lastPush = this.clock();
        this.an.push(e.data);
      };
      this.mode = 'worklet';
    } catch (e) {
      const an = this.fall = ctx.createAnalyser();
      an.fftSize = 8192;
      an.smoothingTimeConstant = 0;
      source.connect(an);
      this.td = new Float32Array(8192);
      this.lastT = ctx.currentTime;
      this.mode = 'analyser';
    }
  }
  // Per rendered frame. Returns true when the analyzer produced a new hop since the last call.
  frame(d) {
    const an = this.an, A = an.A;
    if (this.mode === 'analyser' && !this.silent) {
      const t = this.ctx.currentTime, n = Math.min(8192, Math.round((t - this.lastT) * an.sr));
      if (n > 0) {
        this.fall.getFloatTimeDomainData(this.td);
        an.push(this.td.subarray(8192 - n));
        this.lastT = t;
        this.lastPush = this.clock();
      }
    }
    A.kick *= Math.exp(-d / 0.16);
    A.snare *= Math.exp(-d / 0.13);
    A.hat *= Math.exp(-d / 0.06);
    A.drop *= Math.exp(-d / 1.3);
    A.dropHold *= Math.exp(-d / 14);
    A.dropAge += d;
    A.resolve *= Math.exp(-d / 2.2);
    const T = an.tempo, lead = this.mode === 'none' ? 0 : Math.min(0.05, (this.clock() - this.lastPush) / 1000) + 0.03;
    A.beat = T.beat + lead / T.period;
    A.period = T.period;
    A.flow += d * (0.015 + 0.9 * A.level + 0.6 * A.kick + 1.2 * A.drop);
    A.flowBass += d * (0.01 + A.bass);
    A.flowMid += d * (0.01 + A.midS);
    A.flowHigh += d * (0.01 + A.high);
    for (const k of A.kicks) k.age += d;
    const f = A.fresh;
    A.fresh = false;
    return f;
  }
}
