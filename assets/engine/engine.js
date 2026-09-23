// THE MUSIC ENGINE facade: audio in, MS out. No GL, no DOM.
//   ENGINE.frame(dt, now, nowMs) runs: source tick → v3 extractor (or the fake timeline) → registered stages →
//   test pins (ENGINE.fix) → GROOVE. ENGINE.ms is an EMA of the CPU cost per frame.
import { ema } from '../math/util.js';
import { MS } from './state.js';
import { updateMusic } from './features.js';
import { AU, initAudio, run } from './audio.js';
import { GROOVE, updateGroove } from './groove.js';
import demo from './sources/demo.js';
import capture from './sources/capture.js';
import fake from './sources/fake.js';
import { FEATS } from './feats.js';

AU.startDemo = demo.start;

export const ENGINE = {
  MS, GROOVE, AU, FEATS,
  sources: { demo, capture, fake },
  stages: [],       // [{ name, fn(dt, now, MS), feats:[...] }]
  fix: null,        // test hook: Object.assign(MS, fix) every frame after extraction
  fakeOn: false,    // #test without fake=0: the deterministic timeline replaces the extractor
  ms: 0,

  // Register an analysis stage. Stages run in registration order after the v3 extractor and may only add the
  // MS fields they declare (each must have a FEATS entry).
  addStage(name, fn, feats = []) {
    for (const f of feats) if (!(f in FEATS)) throw new Error('stage ' + name + ' declares undocumented feat ' + f);
    this.stages.push({ name, fn, feats });
  },

  // Start a source by name: 'demo' | 'capture'. msg is shown on the landing card by the UI hook.
  start(name, msg) {
    initAudio();
    if (name === 'capture') return capture.start();
    run('demo', msg);
  },

  frame(dt, now, nowMs) {
    const t0 = performance.now();
    if (this.fakeOn) fake.update(dt, now);
    else {
      capture.tick(nowMs);
      updateMusic(dt, now);
    }
    for (const st of this.stages) st.fn(dt, now, MS);
    if (this.fix) Object.assign(MS, this.fix);
    updateGroove(dt, MS);
    this.ms = ema(this.ms, performance.now() - t0, dt, 1);
  },
};
