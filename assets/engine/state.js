// MS (the music state vector) and XS (extractor scratch). Separate module so engine stages can import
// it without cycles. Lifted from cardioid3 LAYER 1.

// The music state vector. Every visual parameter traces to one of these fields (see feats.js for the schema).
export const MS = {
  presence: 0, bass: 0, mid: 0, high: 0, bassFast: 0, onset: false, hitStrength: 0, hit: 0, onsetRate: 0,
  beat: false, beatPhase: 0, beatCount: 0, bpm: 124, regularity: 0, phaseCorr: 0,
  eS: 0, eM: 0, eL: 0, eMax: 0.3, build: 0, absentT: 0, arc: 'idle', arcHold: 0, dropEvt: false, dropStrength: 0, dropEnv: 0, lastDrop: -99,
  chroma: new Float32Array(12), bchroma: new Float32Array(12), harmAngle: 0, harmUnw: 0, harmVel: 0, clarity: 0, hx: 0, hy: 0,
  tension: 0, rough: 0, rLo: 0.02, rHi: 0.12, suspension: 0, resolveEvt: false, interval: 7, intervalCand: 7, intervalT: 0,
  surprisal: 0, surpriseEvt: false, lastSurprise: -99, sectionEvt: false, sectionId: 0, lastSection: -99, identifyAt: -1, identifyEvt: false,
  seed: { hue: 0.6, th: 0, a: 0.3, scene: -1 }, intensity: 0, peaks: [], wave: new Float32Array(2048), rms: 0,
  // fields v3 created at runtime, declared here so the schema is closed
  highM: 0, buildPk: 0, liveT: 0, arcT: 0, surRaw: 0, repeat: false, _susHi: false,
};

// Extractor scratch state (not part of the contract).
export const XS = {
  fdb: new Float32Array(1024), mag: new Float32Array(1024), lmPrev: new Float32Array(1024), sdb: new Float32Array(4096),
  pkB: 1e-4, pkM: 1e-4, pkH: 1e-4, pkAll: 1e-4, oRing: new Float32Array(96), oi: 0, lastOnset: -9, env: new Float32Array(800), ei: 0, envAcc: 0, tempoT: 0,
  tmp: new Float32Array(800), candBpm: 0, candN: 0, slowTick: 0, pcOf: null, bLo: 0, bHiC: 0, bHiT: 0, bLowC: 0, binS: 5.859375, binF: 23.4375,
  mu: new Float32Array(15), va: new Float32Array(15).fill(0.01), fp: new Float32Array(17), lib: [], arcPrev: 'idle', eAtChange: 0, phraseBeat: 0,
};

