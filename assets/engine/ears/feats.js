// EARS_FEATS: the FEATS entries for every field the ears add, in engine/feats.js's entry shape
// { kind, eli5, formula, drives, range }. The orchestrator spreads this into FEATS; tools/check.js then finds every MS key
// documented. Names checked against CONTRACTS Appendix A — none collides (`mode`, `key`, `sub`, `kick`, `snare`, `hat` are
// taken and are NOT reused here).
const L = (eli5, formula, drives, range = [0, 1]) => ({ kind: 'level', eli5, formula, drives, range });
const R = (eli5, formula, drives, range = null) => ({ kind: 'raw', eli5, formula, drives, range });
const E = (eli5, formula, drives) => ({ kind: 'event', eli5, formula, drives, range: [false, true] });
const C = (eli5, formula, drives, range) => ({ kind: 'count', eli5, formula, drives, range });

export const EARS_FEATS = {
  // --- the sub (engine/ears/sub.js) ---
  subHz: R('the pitch of the sub bass, in Hz (0 = no sub)', 'YIN over a 120 ms window of the 100 Hz-low-passed signal decimated to ~2 kHz, octave-checked, parabolic, then a 5-frame (40 ms) median; hop 8 ms', 'the Chladni figure, any pitch-driven colour', [0, 130]),
  subCents: R('how far the sub is from the nearest equal-tempered note, in cents', 'the fractional part of 69 + 12·log2(subHz/440), x100', 'micro-detune of a figure, a hue nudge', [-50, 50]),
  subNote: C('which pitch class the sub is playing (C = 0), -1 when there is none', 'the nearest note of subHz, as the engine\'s pcOf numbering', 'a 12-entry figure / colour table indexed by the bass note', [-1, 11]),
  subConf: L('how sure that pitch is', '1 - the YIN cumulative-mean-normalised difference at the chosen period', 'fade a pitch-driven channel out when the sub is not clear'),
  subGlide: R('how fast the sub is sliding, in semitones per second (+ = rising)', 'd(12·log2(subHz))/dt, smoothed over 30 ms, clamped to +-48', 'morph between neighbouring figures during a slide', [-48, 48]),
  subNoteEvt: E('a new sub note just started', 'the gate opened, or the sub\'s own level jumped 7 dB, or the pitch moved >= 1 semitone and held 32 ms (backdated by the YIN window\'s half-length so it lands on the real change)', 'retarget the figure, kick the sand'),
  subPure: L('how sine-like the bass is (1 = a pure 808 sine, 0 = a harmonic-rich bass)', '1 - logmap(E(150-600) / E(22-150), 0.05, 1) — the truth tool\'s h/f', 'mix in the 2nd / 3rd harmonic figures: clean lines vs busy ones'),
  subGate: C('is the sub sounding at all (0/1, hysteresis)', 'the 22-60 Hz RMS over its running p90 crosses 0.16 up / 0.075 down AND the 22-70 band owns >= 30 % of 22-600 Hz, with a 45 ms dwell', 'silence the sand when there is no bass ("no sound -> quiet")', [0, 1]),
  subIn: E('the sub just came in', 'subGate 0 -> 1', 'the drop\'s first frame, a burst'),
  subOut: E('the sub just left', 'subGate 1 -> 0', 'let the figure relax, the sand settle'),
  // --- the tonic (engine/ears/tonic.js) ---
  tonic: C('the key\'s root, as a pitch class (C = 0)', 'Krumhansl-Kessler over a chroma that INCLUDES the sub\'s own pitch class (an 8192 FFT of 130-2100 Hz every 372 ms, plus the sub\'s class weighted by its confidence), time constant 11 s', 'the reference note every interval is measured from; palette root', [0, 11]),
  tonicMinor: C('is that key minor (1) or major (0)', 'whichever KK profile correlates best', 'warm / cold palette, consonance table', [0, 1]),
  tonicConf: L('how clearly one key wins', '(best - second best) / |best| over the 24 KK correlations', 'fade harmony-driven channels in'),
  // --- register / texture (engine/ears/texture.js) ---
  bassReg: L('where the bass lives: 0 = a 35 Hz sub, 1 = a 140 Hz mid-bass or above', 'the log-frequency centroid of the 22-70 / 70-150 / 150-600 Hz band powers, mapped between 35 and 140 Hz', 'which octave the visual sits in; the 1:38 climb and the intro'),
  lpSweep: L('how closed a low-pass is (1 = the highs are gone)', '1 - roll / p90(roll), roll = E(5-12k)/E(150-2.5k) smoothed 0.25 s, p90 over ~30 s of the track', 'blur, softness, the outro\'s closing filter'),
  width: L('how wide the stereo image is', 'RMS(side) / RMS(mid), side = (L-R)/2, smoothed 0.35 s', 'spread, how far the figure reaches off-centre'),
  // --- percussion (engine/ears/perc.js) ---
  kickEvt: E('a kick just hit (one read)', 'a 40-150 Hz flux peak WITH a 2.5-8 kHz beater click within 25 ms — a bare low onset is an 808 note start and goes to subNoteEvt instead', 'the hit: a flash, a shove, a ring'),
  snareEvt: E('a snare or clap just hit', 'a 150-2500 Hz flux peak, refractory 60 ms', 'a second, different hit channel'),
  hatEvt: E('a hat just hit', 'a 5-12 kHz flux peak, refractory 45 ms', 'fine, fast detail; the intro\'s rising hats'),
  kickAge: R('seconds since the last kick (99 before any)', 'heard time - the kick\'s own audio time', 'place a fast animation exactly, sub-frame', [0, 99]),
  snareAge: R('seconds since the last snare (99 before any)', 'heard time - the snare\'s own audio time', 'as kickAge', [0, 99]),
  hatAge: R('seconds since the last hat (99 before any)', 'heard time - the hat\'s own audio time', 'as kickAge', [0, 99]),
  kickVel: L('how hard the last kick hit', 'its flux over the class\'s running p95', 'amplitude of the hit'),
  snareVel: L('how hard the last snare hit', 'its flux over the class\'s running p95', 'amplitude of the hit'),
  hatVel: L('how hard the last hat hit', 'its flux over the class\'s running p95', 'amplitude of the hit'),
  denK: R('kicks per second over the last second', 'a 1 s sliding count', 'busy-ness of the low end'),
  denS: R('snares per second over the last second', 'a 1 s sliding count', 'the climbs: 1.7x the groove on this track'),
  denH: R('hats per second over the last second', 'a 1 s sliding count', 'double time, the rising intro'),
  // --- feel (engine/ears/pulse.js) ---
  pulse: R('the felt beat as a multiple of the grid beat: 0.5 = half time, 1, 2 = double time', 'the median kick inter-onset interval over the median of ALL percussive inter-onset intervals, quantised, held 1.2 s', 'breathe on the felt beat, not the grid beat', [0.5, 2]),
};
