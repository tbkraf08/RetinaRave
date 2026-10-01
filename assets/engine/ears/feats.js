// EARS_FEATS: the FEATS entries for every field the ears add, in engine/feats.js's entry shape
// { kind, eli5, formula, drives, range }. The orchestrator spreads this into FEATS; tools/check.js then finds every MS key
// documented. Names checked against CONTRACTS Appendix A — none collides (`mode`, `key`, `sub`, `kick`, `snare`, `hat` are
// taken and are NOT reused here).
// v0.15 pass 2 — TWO things every scene reading these must know, and they are stated in the formula text below:
//   1. THE RELEASE RULE. An event fires on the frame NEAREST its onset, not the first frame at or after it, so on the
//      release frame `kickAge` / `snareAge` / `hatAge` are NEGATIVE, in [-1/120, 0) s. Clamp at 0 if that is a problem;
//      it is at most 8.3 ms. (The old rule always rounded up and cost a median +8.3 ms of pure frame quantisation.)
//   2. IN FILE MODE the percussion events / ages / velocities / densities and `subHz subCents subNote subConf subGate
//      subGlide subIn subOut subNoteEvt` come from the track map's NON-CAUSAL channels, read at heard time: the truth
//      tool's own STFT + separable-HPSS onset front end and its own CENTRED YIN. Same names, same kinds, same ranges,
//      better values (kick F 1.000 against the truth instead of 0.53; the sub within 1 cent instead of 27). In every
//      LIVE mode (capture, mic, an audible file) the causal `engine/ears/` path fills them, as in pass 1.
const L = (eli5, formula, drives, range = [0, 1]) => ({ kind: 'level', eli5, formula, drives, range });
const R = (eli5, formula, drives, range = null) => ({ kind: 'raw', eli5, formula, drives, range });
const E = (eli5, formula, drives) => ({ kind: 'event', eli5, formula, drives, range: [false, true] });
const C = (eli5, formula, drives, range) => ({ kind: 'count', eli5, formula, drives, range });

export const EARS_FEATS = {
  // --- the sub (engine/ears/sub.js) ---
  subHz: R('the pitch of the sub bass, in Hz (0 = no sub)', 'FILE mode: the track map\'s CENTRED YIN - 100 ms window / 10 ms hop of the 130 Hz zero-phase-low-passed signal at sr/20, stamped at the window\'s CENTRE, so the value describes the music AT that instant with no latency to backdate. LIVE: the causal YIN over a 120 ms window of the 100 Hz-low-passed signal decimated to ~2 kHz, octave-checked, parabolic, then a 5-frame (40 ms) median; hop 8 ms, and ~106 ms late by construction', 'the Chladni figure, any pitch-driven colour', [0, 130]),
  subCents: R('how far the sub is from the nearest equal-tempered note, in cents', 'the fractional part of 69 + 12·log2(subHz/440), x100', 'micro-detune of a figure, a hue nudge', [-50, 50]),
  subNote: C('which pitch class the sub is playing (C = 0), -1 when there is none', 'the nearest note of subHz, as the engine\'s pcOf numbering', 'a 12-entry figure / colour table indexed by the bass note', [-1, 11]),
  subConf: L('how sure that pitch is', '1 - the YIN cumulative-mean-normalised difference at the chosen period', 'fade a pitch-driven channel out when the sub is not clear'),
  subGlide: R('how fast the sub is sliding, in semitones per second (+ = rising)', 'd(12·log2(subHz))/dt, smoothed over 30 ms, clamped to +-48', 'morph between neighbouring figures during a slide', [-48, 48]),
  subNoteEvt: E('a new sub note just started', 'the gate opened, or the sub\'s own level jumped 7 dB, or the pitch moved >= 1 semitone and held 32 ms. FILE mode: on the map\'s centred grid, so the event time IS the change. LIVE: backdated by NOTE_LAG = 0.125 s (the ring\'s 46 ms YIN guard + half the 120 ms window + two median frames + half the hold), measured to land the walk\'s notes within 8 ms', 'retarget the figure, kick the sand'),
  subPure: L('how sine-like the bass is (1 = a pure 808 sine, 0 = a harmonic-rich bass)', '1 - logmap(E(150-600) / E(22-150), 0.05, 1) — the truth tool\'s h/f', 'mix in the 2nd / 3rd harmonic figures: clean lines vs busy ones'),
  subGate: C('is the sub sounding at all (0/1, hysteresis)', 'the 22-60 Hz RMS over its running p90 crosses 0.020 up / 0.0094 down AND the 22-70 band owns >= 30 % of 22-600 Hz, with a 45 ms dwell. The pair was 0.16 / 0.075 until v0.25, against a "p90" that was really the p10 (§73): the level half of the gate was all but always satisfied and the gate was effectively the share test alone. The pair is re-fitted so the gate keeps its own five-track timeline (93-100 % frame agreement with v0.25)', 'silence the sand when there is no bass ("no sound -> quiet")', [0, 1]),
  subIn: E('the sub just came in', 'subGate 0 -> 1', 'the drop\'s first frame, a burst'),
  subOut: E('the sub just left', 'subGate 1 -> 0', 'let the figure relax, the sand settle'),
  // --- the tonic (engine/ears/tonic.js) ---
  tonic: C('the key\'s root, as a pitch class (C = 0)', 'Krumhansl-Kessler over a chroma that INCLUDES the sub\'s own pitch class (an 8192 FFT of 130-2100 Hz every 372 ms, plus the sub\'s class weighted by its confidence), time constant 11 s', 'the reference note every interval is measured from; palette root', [0, 11]),
  tonicMinor: C('is that key minor (1) or major (0)', 'whichever KK profile correlates best', 'warm / cold palette, consonance table', [0, 1]),
  tonicConf: L('how clearly one key wins', '(best - second best) / |best| over the 24 KK correlations', 'fade harmony-driven channels in'),
  // --- register / texture (engine/ears/texture.js) ---
  bassReg: L('where the bass lives: 0 = a 35 Hz sub, 1 = a 140 Hz mid-bass or above', 'the log-frequency centroid of the 22-70 / 70-150 / 150-600 Hz band powers, mapped between 35 and 140 Hz', 'which octave the visual sits in; the 1:38 climb and the intro'),
  // §73: this read a p50 of exactly 0.000 on all five tracks until v0.25 — `rollP90` settled on the p10, so
  // `roll / p10` was above 1 nearly always and the field clamped to 0. It is a live 0-1 channel now (p50 0.35-0.73).
  lpSweep: L('how closed a low-pass is (1 = the highs are gone)', '1 - roll / p90(roll), roll = E(5-12k)/E(150-2.5k) smoothed 0.25 s, p90 over ~30 s of the track (the p90 fixed in §73)', 'blur, softness, the outro\'s closing filter'),
  width: L('how wide the stereo image is', 'RMS(side) / RMS(mid), side = (L-R)/2, smoothed 0.35 s', 'spread, how far the figure reaches off-centre'),
  // --- percussion (engine/ears/perc.js) ---
  kickEvt: E('a kick just hit (one read)', 'FILE mode: the track map\'s non-causal 40-150 Hz HPSS onset WITH a 2-12 kHz onset within 15 ms (the truth tool\'s own rule). LIVE: a causal 60-150 Hz RISE over its own 85 ms local mean, >= 5 dB (§68), with a 2.5-8 kHz beater click within 25 ms. Either way a bare low onset is an 808 note start and goes to subNoteEvt instead', 'the hit: a flash, a shove, a ring'),
  snareEvt: E('a snare or clap just hit', 'FILE mode: the track map\'s non-causal 150-2500 Hz HPSS onset. LIVE: the MEAN of the 150-600 and 150-2500 Hz bands\' RISE over their own 85 ms local means, >= 3.75 dB, refractory 75 ms (§69 — a snare is a body AND a noise, and a swell rises in one band only)', 'a second, different hit channel'),
  hatEvt: E('a hat just hit', 'a 5-12 kHz flux peak, refractory 45 ms', 'fine, fast detail; the intro\'s rising hats'),
  kickAge: R('seconds since the last kick (99 before any; slightly NEGATIVE on the frame it fires)', 'heard time - the kick\'s own audio time. The event is released on the frame NEAREST the onset, so on that one frame the age is in [-1/120, 0) s - clamp at 0 if a scene cannot take it', 'place a fast animation exactly, sub-frame', [-0.0084, 99]),
  snareAge: R('seconds since the last snare (99 before any; slightly NEGATIVE on the frame it fires)', 'heard time - the snare\'s own audio time; as kickAge, in [-1/120, 0) on the release frame', 'as kickAge', [-0.0084, 99]),
  hatAge: R('seconds since the last hat (99 before any; slightly NEGATIVE on the frame it fires)', 'heard time - the hat\'s own audio time; as kickAge, in [-1/120, 0) on the release frame', 'as kickAge', [-0.0084, 99]),
  // §73 — the three velocities are a per-track RANK and no longer saturate. Until v0.25 `Quantile(0.95, …)` settled
  // on the p5 (dsp.js's weights were swapped) and 52-91 % of hits read exactly 1.000; the divisor is a real running
  // p95 now, so pooled over the five tracks' true hits they spread p10 0.24-0.30 / p50 0.51-0.63 / p90 1.00 with
  // 12-14 % at the ceiling. They are normalised against THIS TRACK's own fire magnitudes, which is the right
  // question for a rank and the wrong one for a size — use `*Amp` when a scene wants a size (§70).
  kickVel: L('how hard the last kick hit, against this track\'s own loudest kicks', 'its RISE in dB over the lane\'s running p95 (§68; a flux peak before it; the p95 fixed in §73)', 'amplitude of the hit, ranked within the track'),
  snareVel: L('how hard the last snare hit, against this track\'s own loudest snares', 'its two-band RISE in dB over the lane\'s running p95 (§69; a flux peak before it; the p95 fixed in §73)', 'amplitude of the hit, ranked within the track'),
  hatVel: L('how hard the last hat hit, against this track\'s own loudest hats', 'its flux over the class\'s running p95 (fixed in §73)', 'amplitude of the hit, ranked within the track'),
  // §70 — the ABSOLUTE size of a hit, with no quantile in it at all, so the same hit reads the same on every track.
  // The two are complementary and both published: `*Vel` ranks a hit inside its track (a 12 dB snare reads 1.00 on
  // Malicious and 0.55 on WhoLikesToParty), `*Amp` sizes it against a fixed dB span. A scene that fires on
  // `kickEvt` / `snareEvt` ALONE wants the size.
  kickAmp: L('how big the last kick was, on an absolute dB scale (the same hit reads the same on every track)', 'LIVE: the LOW lane\'s own RISE in dB over a fixed 16 dB span, clamped - 5 dB (the lane\'s threshold) reads 0.31, 16 dB and up reads 1. The span is the five tracks\' MEDIAN track\'s p95 rise at a true kick (16.5 dB), so no running quantile and no saturation (§70). FILE+map mode: the map\'s own velocity, which is already a proper offline p95 normalisation', 'the amplitude of a hit fired by the EVENT alone - a flash\'s size, a shove\'s strength'),
  snareAmp: L('how big the last snare was, on an absolute dB scale (the same hit reads the same on every track)', 'LIVE: the SNARE lane\'s two-band RISE in dB over a fixed 12 dB span, clamped - 3.75 dB (the lane\'s threshold) reads 0.31, 12 dB and up reads 1. The span is the median track\'s p95 rise at a true snare (11.9 dB), so the same 0.31 "only just fired" size as kickAmp (§70). FILE+map mode: the map\'s own velocity', 'as kickAmp - DUST\'s flash ring and TORUS2\'s snare wave take their size from it'),
  denK: R('kicks per second over the last second', 'a 1 s sliding count', 'busy-ness of the low end'),
  denS: R('snares per second over the last second', 'a 1 s sliding count', 'the climbs: 1.7x the groove on this track'),
  denH: R('hats per second over the last second', 'a 1 s sliding count', 'double time, the rising intro'),
  // --- feel (engine/ears/pulse.js) ---
  pulse: R('the felt beat as a multiple of the grid beat: 0.5 = half time, 1, 2 = double time', 'the median kick inter-onset interval over the median of ALL percussive inter-onset intervals, quantised, held 1.2 s', 'breathe on the felt beat, not the grid beat', [0.5, 2]),
};
