// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// The launch ring buffer — shared. Lifted out of assets/scenes/torus2/waves.js (v0.14, for GIELIS, id 10) the way
// keycolour.js was lifted out of torus2/colour.js (DECISIONS §36) and nudge.js out of torus2/motion.js (§42), so a
// second scene can speak TORUS2's wave language without importing another scene's folder (CONTRACTS §0: shared code
// goes to assets/math/*). Pure: no GL, no DOM, node-importable.
//
// A hit in a band launches a travelling wave along every ring it applies to: a bump running along the ring parameter
// t ∈ [0, 1), launched at t = 0, travelling at ONE FULL RING PER BAR (4 beats) and fading over about two bars. The
// clock is musical (beatCount + beatPhase) — no wall clock, no drift: a wave launched at beat B sits at
// t = ((beatNow − B) / 4) mod 1 for ever after, so the rhythm becomes visible as the SPACING of the bumps round the
// ring. Four-on-the-floor puts the bar's four kicks at 0, ¼, ½, ¾; a syncopated bass sits unevenly.
//
// All the state is per caller and there is none per ring: three bands × a ring buffer of the last 8 launches, uploaded
// every frame as ages in beats (uWaveB) and amplitudes at launch (uWaveA). Ages, not absolute beats, so a long set
// never loses float precision in the shader.
//
// The state is PER CALLER: mkWaves() returns its own {reset, launch, train, trainMode, step, fill, live, positions} set,
// so two scenes never share one buffer (module-level AT/AM/W/PREV would have made TORUS2's launches and GIELIS's the
// same eight slots, and the second scene to step would have read the first one's edges — the trap nudge.js and
// keycolour.js closed).

export const BANDS = 3;        // 0 kick · 1 snare · 2 hat
export const SLOTS = 8;        // the last 8 launches per band
export const LIFE = 8;         // beats a wave lives (two bars at 4/4) — past this the slot reads as empty
// A rising edge: the band level crosses HI having been below LO last frame. The brief's HI was 0.5, but the
// #test fake timeline sets hat to exactly 0.5, so a strict > 0.5 never fired on it and the hat band stayed empty.
export const HI = 0.45;
export const LO = 0.25;        // …having been below this on the previous frame
export const FAINT = 0.25;     // the `beat` event's own faint kick-class wave when no band hit came in the last beat
// the test train (hooks.train): a fixed pattern replaces the edge detector, so a shot can be read as geometry
const PAT = { '4x4': [0, 1, 2, 3], sync: [0, 1.5, 2, 3.5] };

export function mkWaves() {
  const AT = new Float32Array(BANDS * SLOTS);    // launch beat per slot (−1e9 = never used)
  const AM = new Float32Array(BANDS * SLOTS);    // amplitude at launch
  const W = new Int32Array(BANDS);               // next slot to write per band
  const PREV = new Float32Array(BANDS);          // last frame's level per band, for the edge detector
  const NF = new Int32Array(BANDS);              // launches per band since reset, and the last one's amplitude —
  const LA = new Float32Array(BANDS);            // read-only bookkeeping for a scene's dinfo() ruler, never the look
  let lastHit = -1e9;                            // beat of the last hit in any band
  let mode = null, sched = -1e9;

  function reset() {
    AT.fill(-1e9);
    AM.fill(0);
    W.fill(0);
    PREV.fill(0);
    NF.fill(0);
    LA.fill(0);
    lastHit = -1e9;
    sched = -1e9;
  }
  reset();

  function launch(band, beat, amp) {
    const i = band * SLOTS + W[band];
    AT[i] = beat;
    AM[i] = amp;
    W[band] = (W[band] + 1) % SLOTS;
    NF[band]++; LA[band] = amp;
    lastHit = Math.max(lastHit, beat);
  }

  // hooks.train('4x4' | 'sync' | null): pin the launches to a pattern on the fake clock. The edge detector is off while
  // it is set, so the only waves on screen are the pattern's — four per bar, evenly spaced or not.
  function train(v) {
    mode = v === '4x4' || v === 'sync' ? v : null;
    reset();
    return mode;
  }
  const trainMode = () => mode;

  // One frame. levels = [kick, snare, hat]; beatNow = beatCount + beatPhase; beatEvt = MS.beat.
  // `hits` (DECISIONS §70, optional, per band): a number >= 0 replaces that band's LEVEL EDGE with "an event just
  // fired, launch at this amplitude", and a negative / null / undefined entry leaves the band on the edge detector.
  // It exists because the engine now publishes an unsaturated SIZE for the two rise lanes (`kickAmp` / `snareAmp`), so
  // a caller with a better picker than a follower's rising edge can use it and still have an amplitude to launch at.
  // The level is still passed for that band (the caller may want it elsewhere) and its PREV is still tracked, so
  // switching a band back costs nothing.
  function step(levels, beatNow, beatEvt, hits) {
    if (mode) {
      const P = PAT[mode], bar = Math.floor(beatNow / 4);
      for (let b = bar - 1; b <= bar; b++) {
        for (let j = 0; j < P.length; j++) {
          const t = b * 4 + P[j];
          if (t <= beatNow && t > sched) { launch(0, t, 1); sched = t; }
        }
      }
      return;
    }
    for (let b = 0; b < BANDS; b++) {
      const x = levels[b];
      const h = hits ? hits[b] : undefined;
      if (h !== undefined && h !== null && h >= 0) { if (h > 0) launch(b, beatNow, Math.min(1, h)); }
      else if (x > HI && PREV[b] < LO) launch(b, beatNow, Math.min(1, x));
      PREV[b] = x;
    }
    // a track with no drums still breathes: the beat itself launches a faint kick-class wave
    if (beatEvt && beatNow - lastHit > 1) launch(0, beatNow, FAINT);
  }

  // The uniform payload: age in beats per slot (negative = empty/expired) and the amplitude it was launched with.
  function fill(ages, amps, beatNow) {
    for (let i = 0; i < AT.length; i++) {
      const age = beatNow - AT[i];
      const live = AT[i] > -1e8 && age >= 0 && age <= LIFE;
      ages[i] = live ? age : -1;
      amps[i] = live ? AM[i] : 0;
    }
    return ages;
  }

  // how many waves are alive right now, for the HUD and the test hooks
  function live(beatNow) {
    let n = 0;
    for (let i = 0; i < AT.length; i++) if (AT[i] > -1e8 && beatNow - AT[i] >= 0 && beatNow - AT[i] <= LIFE) n++;
    return n;
  }

  // where the bumps of one band sit round the ring right now (the proof of the spacing, read as numbers)
  function positions(band, beatNow) {
    const out = [];
    for (let s = 0; s < SLOTS; s++) {
      const i = band * SLOTS + s, age = beatNow - AT[i];
      if (AT[i] > -1e8 && age >= 0 && age <= LIFE) out.push(+((age / 4) % 1).toFixed(4));
    }
    return out.sort((a, b) => a - b);
  }

  // read-only: how many waves each band has launched, and the last one's amplitude (a scene's dinfo() ruler)
  const fires = (band) => NF[band];
  const lastAmp = (band) => LA[band];

  return { reset, launch, train, trainMode, step, fill, live, positions, fires, lastAmp };
}
