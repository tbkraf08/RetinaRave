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
import { Ears, EARS_FIELDS } from './ears/ears.js';
import { buildMap, mapAt, mapCross } from './map/map.js';

export const JUMP = 0.05;            // s: a block stamp this far from the expected one starts a fresh Ears
const EVT = ['subNoteEvt', 'subIn', 'subOut', 'kickEvt', 'snareEvt', 'hatEvt'];
const MAP_FIELDS = ['mapOn', 'toDrop', 'toBoundary', 'buildProg', 'mapSection', 'mapNext', 'mapReturn', 'eG', 'mapDropEvt', 'mapBoundaryEvt'];

export const EARS = {
  ears: null, map: null, mapFile: null, next: -1, subscribed: false, lastT: -1, beat: 0, cpu: 0, blocks: 0,
  mapMs: 0, out: {},
};

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
  if (E) {
    if (S.bpm > 0 && E.pulse.setBeat) { const b = 60 / S.bpm; if (b !== EARS.beat) { EARS.beat = b; E.pulse.setBeat(b); } }
    const o = E.read(t);
    for (const k of EARS_FIELDS) S[k] = o[k];
    for (const k of EVT) S[k] = !!o[k];
    for (const e of E.events) ENGINE.log(e.type, e.t, e.vel !== undefined ? { vel: +(+e.vel).toFixed(3) } : undefined);
  }
  const M = AU.mode === 'file' && AU.file === EARS.mapFile ? EARS.map : null;
  if (M) {
    mapAt(M, t, EARS.out);
    for (const k of MAP_FIELDS) if (k in EARS.out) S[k] = EARS.out[k];
    if (EARS.lastT >= 0 && t > EARS.lastT) {
      const x = mapCross(M, EARS.lastT, t);
      S.mapDropEvt = x.drop; S.mapBoundaryEvt = x.boundary;
      if (x.drop) ENGINE.log('mapDrop', t);
    }
    EARS.lastT = t;
  } else if (S.mapOn) {
    S.mapOn = 0; S.toDrop = S.toBoundary = S.mapSection = S.mapNext = -1; S.buildProg = S.mapReturn = S.eG = 0;
  }
}

AU.onFile.push(armMap);
ENGINE.addStage('ears', earsStage, [...EARS_FIELDS, ...MAP_FIELDS]);
