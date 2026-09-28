// THE EARS STAGE (v0.15 E3 + E4): engine/ears/ (causal DSP on the PCM bus) and engine/map/ (the whole track, file mode)
// copied into MS under their own names, evaluated at heard time (MS.heardT, the clock stage). Additive: writes only
// EARS_FIELDS + the map fields, never another stage's. #test (the fake timeline) never runs it — the state.js defaults stand.
//   · the ears subscribe to the PCM bus lazily, the first frame a real source runs (no listener = no worklet under #test);
//     a new Ears is built when the block stamps jump (a new source, a seek), so no history crosses a discontinuity.
//   · the map is built once per decoded file, on the main thread, inside the file source's `gates` (the playhead waits for
//     it: det mode stays frame-exact, real-time mode starts playing after it — ~1.6 s for SeeYouDrop, DECISIONS §48).
import { AU } from './audio.js';
import { MS } from './state.js';
import { ENGINE } from './engine.js';
import { PCM } from './pcm.js';
// In FILE mode with the map ready, the percussion events and the sub fields come from the map's NON-CAUSAL channels
// instead of the causal ears: `map.onsets` is the truth tool's own STFT + separable-HPSS front end (kick F 1.000 against
// `onsets.click`, 0.0 % of kicks on a truth bare808, against the causal path's 0.53 / 8.6 %) and `map.sub` is its own
// CENTRED YIN (+-30 cents on 100.0 % of frames, median 1 cent). Everything else — subPure, the tonic, bassReg, lpSweep,
// width, pulse — and EVERY live mode stays causal, because nothing else in the map covers them.
// The release rule is the same in both paths: an event fires on the frame NEAREST its onset (`t <= heardT + lead`,
// `lead = min(1/120, half the frame interval)`), so `<x>Age` may be negative by up to `lead` on the release frame.
import { Ears, EARS_FIELDS, REL_LEAD, DT_MAX } from './ears/ears.js';
import { DEN_WIN } from './ears/perc.js';
import { buildMap, mapAt, mapCross, mapSubAt } from './map/map.js';

export const JUMP = 0.05;            // s: a block stamp this far from the expected one starts a fresh Ears
const EVT = ['subNoteEvt', 'subIn', 'subOut', 'kickEvt', 'snareEvt', 'hatEvt'];
const MAP_FIELDS = ['mapOn', 'toDrop', 'toBoundary', 'buildProg', 'mapSection', 'mapNext', 'mapReturn', 'eG', 'mapDropEvt', 'mapBoundaryEvt'];
// the three percussion classes the map overrides, and the sub fields it overrides
const PCLS = [['kick', 'kickEvt', 'kickAge', 'kickVel', 'denK'], ['snare', 'snareEvt', 'snareAge', 'snareVel', 'denS'],
  ['hat', 'hatEvt', 'hatAge', 'hatVel', 'denH']];
const SUB_EVT = [['noteT', 'subNoteEvt', 'subNote'], ['inT', 'subIn', 'subIn'], ['outT', 'subOut', 'subOut']];

export const EARS = {
  ears: null, map: null, mapFile: null, next: -1, subscribed: false, lastT: -1, beat: 0, cpu: 0, blocks: 0,
  mapMs: 0, out: {}, sub: {},
  // the map-event release cursors: one index per percussion class and per sub event list, the last released time, and
  // the 1 s sliding history each `den*` counts. Reset by `resetRel()` on a new map or a backwards seek.
  oi: [0, 0, 0], last: [-9, -9, -9], vel: [0, 0, 0], hist: [[], [], []], si: [0, 0, 0],
  tRead: -1, dtRead: 1 / 60,
};
function resetRel() {
  EARS.oi = [0, 0, 0]; EARS.last = [-9, -9, -9]; EARS.vel = [0, 0, 0]; EARS.hist = [[], [], []]; EARS.si = [0, 0, 0];
  EARS.tRead = -1; EARS.dtRead = 1 / 60;
}

function onBlock(L, R, t0) {
  if (ENGINE.fakeOn || !AU.ctx) return;
  if (t0 < 0) return;                               // real-time file mode before the node started (pcm.js map → -1)
  const c0 = performance.now();                     // cost accounting only (ENGINE.ms), never a feature
  if (!EARS.ears || Math.abs(t0 - EARS.next) > JUMP) EARS.ears = new Ears(AU.ctx.sampleRate);
  EARS.ears.push(L, R, t0);
  EARS.next = t0 + L.length / AU.ctx.sampleRate;
  EARS.blocks++;
  EARS.cpu += performance.now() - c0;
}

// Called by sources/file.js (AU.onFile) when a file starts, before its decode: the playhead waits for this gate.
function armMap(F) {
  if (!F || F === EARS.mapFile || !F.gates) return;
  EARS.mapFile = F;
  EARS.map = null;
  resetRel();
  F.gates.push(new Promise((res) => {
    const wait = () => {
      if (AU.file !== F) return res();
      if (!F.ready) return setTimeout(wait, 20);
      setTimeout(() => {                            // one macrotask later: the landing's message has painted
        const c0 = performance.now();
        try { EARS.map = buildMap(F.L, F.R, F.sr); } catch (e) { EARS.map = null; EARS.mapErr = String(e && e.message || e); }
        EARS.mapMs = performance.now() - c0;
        if (EARS.map) ENGINE.log('mapReady', 0, { ms: +EARS.mapMs.toFixed(1), drops: EARS.map.drops, sections: EARS.map.sections.length });
        res();
      }, 0);
    };
    wait();
  }));
}

export function earsStage(dt, now, S) {
  for (const k of EVT) S[k] = false;
  S.mapDropEvt = S.mapBoundaryEvt = false;
  if (ENGINE.fakeOn || !AU.ctx || AU.mode === 'none') return;
  if (!EARS.subscribed) { EARS.subscribed = true; PCM.on(onBlock); }
  ENGINE.extraMs += EARS.cpu; EARS.cpu = 0;         // the push work happens in the PCM listener, outside frame()
  const t = S.heardT, E = EARS.ears;
  // Decided BEFORE the causal read so only one path writes the event log: a map override logs the map's own events with
  // the same type names ('kick' / 'snare' / 'hat' / 'subNote' / 'subIn' / 'subOut'), so the log's vocabulary never changes
  // and nothing is stamped twice.
  const M = AU.mode === 'file' && AU.file === EARS.mapFile && EARS.map && EARS.map.sub && EARS.map.sub.n ? EARS.map : null;
  if (E) {
    if (S.bpm > 0 && E.pulse.setBeat) { const b = 60 / S.bpm; if (b !== EARS.beat) { EARS.beat = b; E.pulse.setBeat(b); } }
    const o = E.read(t);
    for (const k of EARS_FIELDS) S[k] = o[k];
    for (const k of EVT) S[k] = !!o[k];
    if (!M) for (const e of E.events) ENGINE.log(e.type, e.t, e.vel !== undefined ? { vel: +(+e.vel).toFixed(3) } : undefined);
  }
  if (M) {
    mapAt(M, t, EARS.out);
    for (const k of MAP_FIELDS) if (k in EARS.out) S[k] = EARS.out[k];
    // On the FIRST frame a map is active, start the crossing window just before 0 so the first section's own boundary
    // fires. `buildMap` forces `sections[0].t0` to 0 (the first bar line is 0.036 s, not 0) and no frame's half-open
    // (tPrev, t] can contain 0, so pass 1 never fired it and the in-page boundary ruler read 7 of 11 against a ceiling of
    // 11 — `compare.py --make-synth`, a trace built from the truth itself, DOES fire a boundary on frame 0, so grading
    // the page without one was comparing against a reference the page could not match.
    if (EARS.lastT < 0) EARS.lastT = -1e-9;
    if (t > EARS.lastT) {
      const x = mapCross(M, EARS.lastT, t);
      S.mapDropEvt = x.drop; S.mapBoundaryEvt = x.boundary;
      if (x.drop) ENGINE.log('mapDrop', t);
      if (x.boundary) ENGINE.log('mapBoundary', t);
    }
    if (t < EARS.lastT - 1e-9) resetRel();                         // a seek backwards: the cursors are stale
    EARS.lastT = t;
    mapOverride(M, t, S);
  } else if (S.mapOn) {
    S.mapOn = 0; S.toDrop = S.toBoundary = S.mapSection = S.mapNext = -1; S.buildProg = S.mapReturn = S.eG = 0;
  }
}

// File mode: replace the causal percussion events / ages / velocities / densities and the sub's pitch and gate fields
// with the map's non-causal ones, released at heard time by the same rule the causal path uses.
function mapOverride(M, t, S) {
  if (!M.onsets || !M.sub || !M.sub.n) return;
  if (EARS.tRead >= 0) { const d = t - EARS.tRead; if (d > 0 && d <= DT_MAX) EARS.dtRead += (d - EARS.dtRead) * 0.2; }
  EARS.tRead = t;
  const rel = t + Math.min(REL_LEAD, 0.5 * EARS.dtRead);
  for (let c = 0; c < 3; c++) {
    const [cls, ev, age, vf, den] = PCLS[c], list = M.onsets[cls];
    let fired = false;
    while (EARS.oi[c] < list.length && list[EARS.oi[c]].t <= rel) {
      const e = list[EARS.oi[c]++];
      fired = true; EARS.last[c] = e.t; EARS.vel[c] = e.vel;
      EARS.hist[c].push(e.t);
      ENGINE.log(cls, e.t, { vel: e.vel });
    }
    const h = EARS.hist[c];
    while (h.length && t - h[0] > DEN_WIN) h.shift();
    S[ev] = fired;
    S[age] = EARS.last[c] === -9 ? 99 : t - EARS.last[c];      // may be negative by up to `lead` on the release frame
    S[vf] = EARS.vel[c];
    S[den] = h.length / DEN_WIN;
  }
  mapSubAt(M, t, EARS.sub);
  S.subHz = EARS.sub.hz; S.subCents = EARS.sub.cents; S.subNote = EARS.sub.note;
  S.subConf = EARS.sub.conf; S.subGate = EARS.sub.gate; S.subGlide = EARS.sub.glide;
  for (let i = 0; i < SUB_EVT.length; i++) {
    const [key, fld, lg] = SUB_EVT[i], list = M.sub[key];
    let fired = false;
    while (EARS.si[i] < list.length && list[EARS.si[i]] <= rel) { const v = list[EARS.si[i]++]; fired = true; ENGINE.log(lg, v); }
    S[fld] = fired;
  }
}

AU.onFile.push(armMap);
ENGINE.addStage('ears', earsStage, [...EARS_FIELDS, ...MAP_FIELDS]);
