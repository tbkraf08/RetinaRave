// FEATS: the self-documenting schema of MS. Every key of MS has an entry here (tools/check.js enforces it).
// Each entry: { eli5, formula, kind, range, drives }.
//   kind: 'level' 0..1 smoothed | 'raw' unbounded | 'event' true for exactly one frame | 'count' | 'angle' rad |
//         'enum' | 'vector' | 'internal' (state a stage keeps on MS; scenes should not read it)
//   drives: what it moves visually (documentation only).
// Stages may only ADD fields they declare here and must never overwrite another stage's fields (docs/ENGINE.md).

const L = (eli5, formula, drives, range = [0, 1]) => ({ kind: 'level', eli5, formula, drives, range });
const R = (eli5, formula, drives) => ({ kind: 'raw', eli5, formula, drives, range: null });
const E = (eli5, formula, drives) => ({ kind: 'event', eli5, formula, drives, range: [false, true] });
const I = (eli5, formula) => ({ kind: 'internal', eli5, formula, drives: '-', range: null });

export const FEATS = {
  // --- loudness / bands (features.js) ---
  presence: L('is there music at all', 'ema(smoothstep(-62,-44, dB(rms)))', 'idle behaviour, palette wobble'),
  bass: L('how strong the bass is right now', 'pow(band(20-150Hz)/peakFollower, .8)·presence', 'uBands.x, view scale, orbit size'),
  mid: L('how strong the mids are', 'pow(band(150-2000Hz)/peak, .7)·presence', 'uBands.y, trap radius'),
  high: L('how strong the highs are', 'pow(band(2-12kHz)/peak, .7)·presence', 'uBands.z'),
  bassFast: L('bass with a very fast attack (for kicks)', 'pow(fastEma(band)/peak, .8)·presence', 'drop detection, beat phase lock'),
  rms: R('raw loudness of the waveform', 'sqrt(mean(wave²))', 'nothing directly'),
  wave: { kind: 'vector', eli5: 'the last 2048 audio samples', formula: 'AnalyserNode time domain', drives: 'nothing in NAV', range: [-1, 1] },
  // --- onsets ---
  onset: E('a hit just happened (one frame)', 'spectral flux > mean+1.5σ of last 96 frames', 'kick toward a Misiurewicz point, nod'),
  hitStrength: L('how hard that hit was', '(flux-thr)/(3σ+.05)', 'kick amplitude'),
  hit: L('the hit, decaying over ~0.14 s', 'max(hit, hitStrength)·exp(-dt/.14)', 'uBeat.y, palette brightness, flash'),
  onsetRate: R('hits per second', 'Σonsets·exp(-dt/1)', 'build cue'),
  // --- tempo / beat ---
  beat: E('a beat boundary just passed', 'beatPhase wrapped', 'retargeting, scene switch gating'),
  beatPhase: L('where we are inside the beat, 0→1', 'phase += bpm/60·dt + PLL correction', 'uBeat.x, sway, trap rotation'),
  beatCount: { kind: 'count', eli5: 'beats since start', formula: 'increments on beat', drives: 'phrase alignment, hysteresis', range: [0, Infinity] },
  bpm: R('tempo', 'argmax of autocorrelation of the 100 Hz onset envelope, parabolic refine', 'beat rate, crossfade duration'),
  regularity: L('how steady the rhythm is', 'clamp(acf peak·1.6)·presence', 'sway amplitude, scene scores'),
  phaseCorr: I('pending beat-phase correction', 'PLL residual, bled at τ=0.18 s'),
  // --- energy arc ---
  eS: L('short-term energy (0.3 s)', 'ema(pow(.45 bass+.35 mid+.2 high, .8), .3 s)', 'uArc.x, intensity, drift rate'),
  eM: L('medium-term energy (2.5 s)', 'ema(e, 2.5 s)', 'arc classification, palette'),
  eL: L('long-term energy (12 s)', 'ema(e, 12 s)', 'build cue (eM-eL)'),
  eMax: L('the loudest eM seen lately', 'max(eMax·exp(-dt/60), eM, .15)', 'valley/sustain threshold'),
  build: L('a build-up is happening', 'ema(clamp(2(eM-eL) | absence cues))', 'uArc.y, park at the root, scene precedence'),
  absentT: R('seconds since the bass left', 'bassFast<.5 ? +dt : 0', 'first drop path'),
  arc: { kind: 'enum', eli5: 'which part of the song this is', formula: 'idle|valley|sustain|build|peak from presence/eM/build/drop', drives: 'scene precedence, kal', range: ['idle', 'valley', 'sustain', 'build', 'peak'] },
  arcHold: I('hysteresis timer for arc changes', '+dt while candidate ≠ arc'),
  arcT: R('seconds in the current arc', '+dt, reset on change', 'drop gating'),
  dropEvt: E('THE DROP just landed', 'bass returns after >1.8 s absence, or hard hit far above eM after a build', 'hard cut to NAV EXT, flash, glitch'),
  dropStrength: L('how big the drop was', '.45+absent/10+.4 build | .35+.6 max(buildPk, e-eM)', 'exterior depth after the drop'),
  dropEnv: L('the drop, decaying over ~2 beats', 'exp(-dt/(2.2·60/bpm))', 'uBeat.w, zoom, feedback zoom'),
  lastDrop: R('time of the last drop (s)', 'now at dropEvt', 'refractory'),
  buildPk: L('recent peak of build', 'max(buildPk·exp(-dt/3), build)', 'second drop path'),
  liveT: R('seconds of continuous presence', 'presence>.3 ? +dt : 0', 'drop warm-up guard'),
  highM: L('slow highs (3 s)', 'ema(high, 3 s)', 'riser cue'),
  // --- harmony (features-slow.js) ---
  chroma: { kind: 'vector', eli5: 'how much of each of the 12 pitch classes is present', formula: 'peak-picked long FFT binned by pitch class, ema .25 s', drives: 'fingerprint, surprisal, torus latitudes', range: [0, 1] },
  bchroma: { kind: 'vector', eli5: 'the same, bass only (<240 Hz)', formula: 'ema .35 s', drives: 'root note for interval', range: [0, 1] },
  harmAngle: { kind: 'angle', eli5: 'where the harmony sits on the circle of fifths', formula: 'atan2 of chroma centroid on the fifths circle', drives: 'uHarm.x, palette hue offset', range: [-Math.PI, Math.PI] },
  harmUnw: R('the same angle, unwrapped (keeps turning)', 'harmAngle accumulated without wrap', 'alpha on the cardioid, EXT theta, phi'),
  harmVel: R('how fast the harmony is moving', 'ema(|Δangle|/dt, .8 s)', 'uHarm.y, hue drift rate'),
  clarity: L('how clearly tonal the music is', 'clamp(|centroid|·2.2)·presence', 'uHarm.z, harmony gating, scene scores'),
  hx: I('chroma centroid x on the fifths circle', 'ema .7 s'),
  hy: I('chroma centroid y on the fifths circle', 'ema .7 s'),
  interval: { kind: 'count', eli5: 'the interval (semitones) between the bass note and the strongest other note', formula: 'argmax bchroma vs argmax chroma, held .45 s', drives: 'which bulb / torus knot', range: [0, 11] },
  intervalCand: I('candidate interval being timed', 'argmax'),
  intervalT: I('seconds the candidate has held', '+dt'),
  peaks: { kind: 'vector', eli5: 'the four strongest partials [Hz, amp]', formula: 'parabolic-refined spectral peaks', drives: 'DRUM Koenigs modes', range: null },
  // --- tension ---
  rough: R('Sethares roughness of the strongest partials', 'Σ a·(e^{-3.51 s}-e^{-5.75 s})/Σa', 'tension'),
  rLo: I('running floor of roughness', 'slow min follower'),
  rHi: I('running ceiling of roughness', 'slow max follower'),
  tension: L('how dissonant / tense it feels', 'ema((rough-rLo)/(rHi-rLo))·presence, .35 s', 'uArc.z, exterior depth, park, mood'),
  suspension: L('tension held high for a while', 'ema(smoothstep(.55,.8,tension))·presence, 1.3 s', 'park at the root'),
  resolveEvt: E('a held tension just released', 'suspension was >.6 and tension fell <.4', 'visual time release'),
  _susHi: I('latch for resolveEvt', 'suspension>.6'),
  intensity: L('overall intensity', '.62 eS + .38 tension·presence', 'depth into a bulb, palette'),
  // --- surprisal / sections ---
  surprisal: L('how unexpected the music just got', 'z-scored prediction error of chroma+bands vs their running model', 'uArc.w, glitch'),
  surRaw: R('raw surprisal before shaping', 'sqrt(Σ d²/var /15)', 'HUD'),
  surpriseEvt: E('a real surprise (one frame)', 'surprisal>.62, 2.5 s refractory', 'hard scene switch, glitch'),
  lastSurprise: R('time of the last surprise', 'now', 'refractory'),
  sectionEvt: E('the song moved to a new section', 'arc change | 32-beat energy change | surprise', 'groove direction, fingerprint reset'),
  sectionId: { kind: 'count', eli5: 'which section this is (repeats get the same id)', formula: 'cosine match of the 17-dim fingerprint against the library', drives: 'seed noise in scene scores, kaleido segments', range: [0, Infinity] },
  lastSection: R('time of the last section event', 'now', 'refractory'),
  identifyAt: I('scheduled time to identify the section', 'sectionEvt+2.2 s'),
  identifyEvt: E('the section was just identified', '2.2 s after sectionEvt', 'soft scene switch'),
  repeat: { kind: 'level', eli5: 'is this section one we have seen before', formula: 'fingerprint match > .965', drives: 'baby dive, look memory', range: [false, true] },
  seed: { kind: 'vector', eli5: 'per-section random constants {hue, th, a, scene}', formula: 'drawn once per new section', drives: 'palette offset, drift direction, alpha offset, remembered scene', range: null },
};

export const FEAT_KEYS = Object.keys(FEATS);
