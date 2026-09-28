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
  // synapse stage (features-synapse.js) — additive, never overwrites the above
  bassS: 0, midS: 0, highS: 0, sub: 0, lvl: 0, kick: 0, snare: 0, hat: 0, kickCount: 0, alive: 0, hush: 0, calm: 0, resolve: 0,
  flow: 0, flowBass: 0, flowMid: 0, flowHigh: 0, centroid: 0.4, flux: 0, dirty: 0, punchy: 0.5, perc: 0,
  beatConf: 0, gridTrust: 0, barConf: 0, phraseConf: 0, bar: 0, barPos: 0, barPhase: 0, phrasePos: 0, phrase16Pos: 0, beatSyn: 0, bpmSyn: 0,
  key: 9, mode: 1, keyConf: 0, novelty: 0, foote: 0, boundaryEvt: false, sectionAlt: -1, sectionReturn: 0, sectionAge: 0, sectionRenumber: null,
  dropExpectedIn: -1, dropConf: 0, fakeoutEvt: false, valence: 0.5, arousal: 0.3, moodFamily: 0, moodEvt: false, riser: 0, roll: 0, swell: 0, hp: 0,
  // clock stage (engine.js, v0.15 E2) — the engine's time base, written before every other stage
  heardT: -1, fileOn: 0,
};

// Engine-owned texture sources (uploaded by the core when hop changes): log spectrum 256×1, waveform 512×1,
// spectrogram ring 256×128 (row = the newest row). Filled by the synapse stage, or by the fake timeline under #test.
export const TEX = { spec: new Uint8Array(256), wave: new Uint8Array(512).fill(128), hist: new Uint8Array(256 * 128), row: 0, hop: 0 };

// Extractor scratch state (not part of the contract).
export const XS = {
  fdb: new Float32Array(1024), mag: new Float32Array(1024), lmPrev: new Float32Array(1024), sdb: new Float32Array(4096),
  pkB: 1e-4, pkM: 1e-4, pkH: 1e-4, pkAll: 1e-4, oRing: new Float32Array(96), oi: 0, lastOnset: -9, env: new Float32Array(800), ei: 0, envAcc: 0, envNow: 0, tempoT: 0,
  tmp: new Float32Array(800), candBpm: 0, candN: 0, tempoAge: 99, slowTick: 0, pcOf: null, bLo: 0, bHiC: 0, bHiT: 0, bLowC: 0, binS: 5.859375, binF: 23.4375,
  mu: new Float32Array(15), va: new Float32Array(15).fill(0.01), fp: new Float32Array(17), lib: [], arcPrev: 'idle', eAtChange: 0, phraseBeat: 0,
  holdUntil: -1, reseed: false, // v0.3 resume-hold (ENGINE.resume): events masked until holdUntil, flux/surprise baselines re-seated once
  relN: 0, relQ: 0,             // v0.3 §21 tempo 3:2 arbitration: consecutive short-window votes for the relative relQ
};

