// THE MUSIC ENGINE facade: audio in, MS out. No GL, no DOM.
//   ENGINE.frame(dt, now, nowMs) runs: source tick → v3 extractor (or the fake timeline) → registered stages →
//   test pins (ENGINE.fix) → GROOVE. ENGINE.ms is an EMA of the CPU cost per frame.
import { ema } from '../math/util.js';
import { MS, TEX, XS } from './state.js';
import { updateMusic } from './features.js';
import { AU, initAudio, run } from './audio.js';
import { GROOVE, updateGroove } from './groove.js';
import demo from './sources/demo.js';
import capture from './sources/capture.js';
import mic from './sources/mic.js';
import fake from './sources/fake.js';
import demoSynapse from './sources/demo-synapse.js';
import { FEATS } from './feats.js';

AU.startDemo = () => (ENGINE.demoStyle ? demoSynapse.start(ENGINE.demoStyle) : demo.start());

export const ENGINE = {
  MS, GROOVE, AU, FEATS,
  sources: { demo, capture, mic, fake, 'demo-synapse': demoSynapse },
  demoStyle: null,  // &demo=<style> selects the synapse synth; null = the v3 demo (parity)
  tex: TEX,         // engine-owned texture arrays (spec/wave/hist); the core uploads them
  extraMs: 0,       // CPU spent outside frame() by stages (worklet port handler), drained into ms
  stages: [],       // [{ name, fn(dt, now, MS), feats:[...] }]
  fix: null,        // test hook: Object.assign(MS, fix) every frame after extraction
  fakeOn: false,    // #test without fake=0: the deterministic timeline replaces the extractor
  ms: 0,
  resumeAt: -1,     // `now` of the first frame after a hidden tab (v0.3 resume-hold); the extractor holds its events for 1 s from it
  resumePending: false,
  resumed: false,   // true during the one frame stamped resumeAt (the core zeroes its own transients on it)

  // The page came back from hidden (main.js, visibilitychange). The next frame() stamps resumeAt and arms the extractor's
  // hold + re-seat (features.js). The fake timeline is untouched: it is a function of `now`, nothing in it was frozen.
  resume() { this.resumePending = true; },

  // Register an analysis stage. Stages run in registration order after the v3 extractor and may only add the
  // MS fields they declare (each must have a FEATS entry).
  addStage(name, fn, feats = []) {
    for (const f of feats) if (!(f in FEATS)) throw new Error('stage ' + name + ' declares undocumented feat ' + f);
    this.stages.push({ name, fn, feats });
  },

  // Start a source by name: 'demo' | 'capture' | 'mic'. msg is shown on the landing card by the UI hook.
  start(name, msg) {
    initAudio();
    if (name === 'capture') return capture.start();
    if (name === 'mic') return mic.start();
    run('demo', msg);
  },

  frame(dt, now, nowMs) {
    const t0 = performance.now();
    this.resumed = false;
    if (this.resumePending) {
      this.resumePending = false;
      if (!this.fakeOn) {
        this.resumeAt = now; this.resumed = true;
        XS.holdUntil = now + 1; XS.reseed = true;
        MS.hit = MS.dropEnv = 0; // transients the gap has long outlived — the loop's dt clamp would carry them across it
      }
    }
    if (this.fakeOn) fake.update(dt, now);
    else {
      capture.tick(nowMs); // the silence watchdog, for capture and mic alike
      updateMusic(dt, now);
    }
    for (const st of this.stages) st.fn(dt, now, MS);
    if (this.fix) Object.assign(MS, this.fix);
    updateGroove(dt, MS);
    this.ms = ema(this.ms, performance.now() - t0 + this.extraMs, dt, 1);
    this.extraMs = 0;
  },
};
