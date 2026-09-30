// DUST — the beat grid (DECISIONS §57 step 1).
//
// Everything that used to advance on a flow clock — the cloud's own spin, the torus's main turn, the galaxy's
// winding — advances per BEAT instead, on the beat clock the engine publishes as `beatCount` / `beatPhase` (the PCM
// clock since DECISIONS §56). The target angle is read off the beat COUNT, so it can never drift (TORUS2's rule,
// §36 spec 4a), and the angle EASES to it over ~0.22 s: a beat is a nudge that springs into place, not a steady
// spin. The downbeat is worth half a step more, so a bar reads as four nudges of which the first is the biggest.
//
// The flow clocks stay, but only as the slow drift underneath: the per-grain wobble and the ribbon's twist
// (`flowMid`), the fibre family's tumble (`flowBass`), the jitter's phase (`flow`). None of them is the beat.
//
// A formation change may land only where the music has a seam — a 16-beat phrase boundary, or a bar the bar store
// says starts something new (`barNovelEvt`) — never on a count of kicks, which is what the scene used to do.

const TAU = Math.PI * 2;

export const STEP = TAU / 32;     // radians of cloud spin per beat: one turn every 32 beats (12.8 s at 150 BPM)
export const DOWN = 0.5;          // the downbeat is worth this much of a beat step on top of its own
export const TC = 0.22;           // the nudge's time constant (well inside a 0.4 s beat at 150 BPM)
export const TORUS_K = 0.7;       // the torus's main circle turns this much again on top of the cloud's spin
export const GAL_K = 0.9;         // the galaxy's winding rate, divided by (r + .35) so the core winds faster

// The bar index on synapse's own grid: `barPos` is the position inside the bar in beats, so the continuous beat
// position minus it is the bar LINE and a quarter of that is the bar number. Rounded, because the beat count and
// the bar phase are published by different stages (§56: "the bar phase is the count's mod 4 wherever synapse is not
// sure") — a half-beat disagreement between them must not make the downbeat count jitter.
export function barIndex(MS) {
  return Math.round((MS.beatCount + MS.beatPhase - MS.barPos) / 4);
}

// The target angle, read off the counts — never integrated, so it cannot drift.
export function spinTarget(MS) {
  return STEP * (MS.beatCount + DOWN * barIndex(MS));
}

// One eased step toward the target. The delta is taken the short way round, so a clock re-seat that moves the count
// by more than half a turn nudges the cloud the near way instead of spinning it all the way round.
export function ease(cur, target, dt) {
  let d = target - cur;
  d -= TAU * Math.floor(d / TAU + 0.5);
  return cur + d * (1 - Math.exp(-dt / TC));
}

// The trigger state: the last phrase position seen, and what fired last.
export function mkTrigger() {
  return { p16: 0, why: '' };
}

// Returns the reason a formation change may land on this frame, or '' for none. `ready` is the scene's own gate:
// a pour already running is the change, and a second one on top of it would be a jump, not a pour.
export function trigger(T, MS, ready) {
  const wrap = MS.phrase16Pos < T.p16 - 8;       // the 16-beat phrase wrapped past its line
  T.p16 = MS.phrase16Pos;
  T.why = !ready ? '' : MS.barNovelEvt ? 'novel' : wrap ? 'phrase' : '';
  return T.why;
}
