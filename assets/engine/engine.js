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
import file, { DET_LEAD, FPS } from './sources/file.js';
import { TRACE, LOG, pushLog } from './trace.js';
import { PCM } from './pcm.js';
import { FEATS } from './feats.js';
import { LEAD, restore as leadRestore, apply as leadApply } from './lead.js';

AU.startDemo = () => (ENGINE.demoStyle ? demoSynapse.start(ENGINE.demoStyle) : demo.start());

export const ENGINE = {
  MS, GROOVE, AU, FEATS,
  LEAD,             // live step 2: the clocks moved onto heard time (engine/lead.js); on by default since v0.16, &lead=0 turns it off
  useMap: true,     // live step 3.0: false (&map=0) = a file never builds its track map, so the ears stay CAUSAL — the live path, deterministic
  sources: { demo, capture, mic, fake, file, 'demo-synapse': demoSynapse },
  demoStyle: null,  // &demo=<style> selects the synapse synth; null = the v3 demo (parity)
  tex: TEX,         // engine-owned texture arrays (spec/wave/hist); the core uploads them
  extraMs: 0,       // CPU spent outside frame() by stages (worklet port handler), drained into ms
  stages: [],       // [{ name, fn(dt, now, MS), feats:[...] }]
  fix: null,        // test hook: Object.assign(MS, fix) every frame after extraction
  QUEUE: null,      // live step 5: the predicted-event queue's stage object (features-queue.js sets it; .list = the entries)
  fakeOn: false,    // #test without fake=0: the deterministic timeline replaces the extractor
  ms: 0,
  frameN: 0,        // v0.15: frames run by frame(); the trace's `f` and the event log's `f`
  PCM,              // v0.15 E1: the PCM bus (PCM.on(fn) -> fn(L, R, t0)); the EARS stage subscribes here
  TRACE,            // v0.15 E1: the per-frame MS recorder tools/filetrace.js drives (ENGINE.TRACE.start/stop)
  LOG,              // v0.15 E2: the event ring behind log() below, cap 20 000 (engine/trace.js LOG_CAP)
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

  // v0.15 E2: record one event at its audio time (docs/ENGINE.md "Time"): { type, t, f: frameN, ...extra }. The hook the
  // ears' sub-frame onsets hang on; sources/file.js logs fileStart / fileEnd through engine/trace.js directly.
  log(type, t, extra) { return pushLog(type, t, this.frameN, extra); },

  // What the trace's header says about this run. mode: 'file-det' | 'file-rt' | 'capture' | 'mic' | 'demo' | 'none'.
  traceMeta() {
    const F = AU.file;
    return {
      track: F ? F.name : null,
      mode: AU.mode === 'file' && F ? (F.det ? 'file-det' : 'file-rt') : AU.mode,
      sr: AU.ctx ? AU.ctx.sampleRate : 0, at: F ? F.at : 0, fps: FPS, detLead: DET_LEAD,
    };
  },

  // Start a source by name: 'demo' | 'capture' | 'mic' | 'file'. msg is shown on the landing card by the UI hook; for
  // 'file' it is the option object instead: { src, at, det, sync, msg } (sources/file.js startFile).
  start(name, msg) {
    initAudio();
    if (name === 'capture') return capture.start();
    if (name === 'mic') return mic.start();
    if (name === 'file') { this.fakeOn = false; return file.start(msg && msg.src, msg || {}); } // a real track, never the fake timeline
    run('demo', msg);
  },

  frame(dt, now, nowMs) {
    const t0 = performance.now();
    this.frameN++;
    this.resumed = false;
    if (this.resumePending) {
      this.resumePending = false;
      if (!this.fakeOn) {
        this.resumeAt = now; this.resumed = true;
        XS.holdUntil = now + 1; XS.reseed = true;
        MS.hit = MS.dropEnv = 0; // transients the gap has long outlived — the loop's dt clamp would carry them across it
      }
    }
    leadRestore(MS);  // the clocks' own values back before anything integrates them (engine/lead.js; a no-op when off)
    if (this.fakeOn) fake.update(dt, now);
    else {
      // v0.15 E1: the file source advances the playhead here — the analyser shims are seeked and the synapse tap is fed
      // its exact blocks BEFORE the extractor and the synapse stage read them. A no-op in every other mode.
      file.tick(nowMs);
      capture.tick(nowMs); // the silence watchdog, for capture and mic alike
      updateMusic(dt, now);
    }
    for (const st of this.stages) st.fn(dt, now, MS);
    leadApply(dt, MS, this.fakeOn); // after every stage, before the groove, the core and the trace read the clocks
    if (this.fix) Object.assign(MS, this.fix);
    updateGroove(dt, MS);
    TRACE.frame(MS, this.frameN, MS.heardT, TRACE.meta || this.traceMeta());
    this.ms = ema(this.ms, performance.now() - t0 + this.extraMs, dt, 1);
    this.extraMs = 0;
  },
};

// v0.15 E2 — the clock stage: the audio time the listener hears at this frame, and whether a file is the source. It runs
// FIRST (registered before features-synapse.js's 'synapse' stage), writes only its own two fields, and is the only thing
// in the engine that reads AU.heardT per frame.
ENGINE.addStage('clock', (dt, now, S) => {
  S.heardT = AU.heardT();
  S.fileOn = AU.mode === 'file' ? 1 : 0;
}, ['heardT', 'fileOn']);
