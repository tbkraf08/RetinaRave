// DUST — the beat grid (DECISIONS §57 step 1, §58 task B, §61 step 2).
//
// Everything that used to advance on a flow clock — the cloud's own spin, the torus's main turn, the galaxy's
// winding — advances per BEAT instead, on the beat clock the engine publishes as `beatCount` / `beatPhase` (the PCM
// clock since DECISIONS §56).
//
// THE NUDGE IS A VELOCITY PROFILE, not an ease toward a target (§61 step 2). The two shapes before it both came from
// the user's eye and each fixed the other's complaint:
//
//   §57  one exponential, tau 0.22 s        -> "visuals almost seem slow to register on the beat" (50 % of the step
//                                              landed 167 ms after the beat, 90 % at 417 ms, and a beat is 400 ms)
//   §58  a shaped impulse, 0.055 / 0.14 s   -> "rewatching see you drop, think nudge is jerky there also"
//
// §58's impulse put 50 % of the step on screen in 50 ms, which is what the user asked for, by making the angle's
// VELOCITY jump from nothing to 3.1 rad/s in a single frame and then fall back to nothing: measured at 60 fps on an
// exact 150 BPM clock, its velocity floor is 1 % of its peak, 75 % of every beat is spent under a tenth of the peak,
// and its peak |acceleration| is 187 rad/s^2 — a dead cloud that snaps and dies again. That reads as stop-start.
// For comparison TORUS2 (`scenes/torus2/motion.js`, the user's favourite music-to-visual mapping: a step of 2pi/16
// per beat eased with ONE tau of 0.3 s) never stops at all — its floor is 28 % of its peak and its peak acceleration
// is 75 rad/s^2 — because at tau 0.3 a 0.4 s beat only completes 74 % of the step and the rest glides on.
//
// So the angle is now a closed form of (beatCount, beatPhase) whose derivative is a BASE GLIDE plus a RAISED-COSINE
// ACCENT centred on the beat line:
//
//   v(u) / step = GLIDE + (1 - GLIDE) * bump(u),      bump = (1/W)(1 + cos(2 pi (u - W/2) / W)) on u in [0, W]
//
// and the angle is its exact integral, so nothing is integrated per frame and the motion CANNOT drift (§57's own
// rule, kept): `ang = A(m) + step(m) * PHI(u)`, with A(m) the accumulated angle at beat m and PHI(0) = 0, PHI(1) = 1.
// The accent STARTS half its width before the beat line and PEAKS ON it, which is why `u` is the phase of
// `beatCount + beatPhase + W/2` and not of the beat itself: the eye sees the motion crest on the beat instead of
// starting there, the way a dancer anticipates, and the acceleration is finite everywhere by construction.
//
// MEASURED at 60 fps on exact clocks (tools/work/v/nudge.py; per-beat medians, 150 / 90 / 160 BPM):
//
//   design                       v peak       v floor / peak      dead (v < 10 % peak)   max |a|          peak at
//   §58 shaped impulse           3.14 rad/s        1 %                   75 %            187 rad/s^2      -8 ms
//   TORUS2 (tau .3, step 2x)     1.73             28 %                    0 %             75              -8 ms
//   THIS (GLIDE .45, W .55)      1.18             19 %                    0 %              14              -8 ms
//
// MEASURED AGAIN on the real traces, by replaying BOTH designs on the SAME recorded clock columns (the nudge is a
// pure function of `beatCount` / `beatPhase` / `barPos`, all three in tools/dust-trace.js's set, so the A/B is exact
// and costs no page run: tools/work/v/replay.py, whose "§58" row reproduces the traced `d_spin` to the digit).
// SeeYouDrop 20-110 s / CyborgNinja 20-80 s / Vienna 0-190 s, per-beat medians:
//
//   design                     max |a| (the jerk)        dead time        v floor / peak       90 % of the step
//   §58 shaped impulse        187 / 187 / 187        75 / 73 / 75 %      1 / 1 / 0 %      +467 / +433 / +733 ms
//   THIS (GLIDE .45, W .55)    18 /  16 /  26         0 /  0 /  0 %     17 / 18 / 11 %    +467 / +433 / +800 ms
//
// — the jerk number falls TEN-FOLD, the dead time to nothing, and the step's own timing is kept to the frame: the
// velocity still peaks 8 ms before the beat line on all three tracks, 25 % of the step is done 0 ms after it (§58:
// +17 ms) and 90 % of it at exactly §58's own time. TORUS2 measured with the same ruler sits at 75 rad/s^2 with a
// 28 % floor, so this is smoother than the user's favourite mapping and a tenth as jerky as what it replaces.
// What is given up, stated: the peak velocity §58 doubled falls back from 3.14 to 1.31 rad/s. The spike IS the
// thing the user calls jerky; what replaces it is a crest 5.9x the floor instead of 108x.
//
// The flow clocks stay, but only as the slow drift underneath: the per-grain wobble and the ribbon's twist
// (`flowMid`), the fibre family's tumble (`flowBass`), the jitter's phase (`flow`). None of them is the beat.
//
// A formation change may land only where the music has a seam — a 16-beat phrase boundary, or a bar the bar store
// says starts something new (`barNovelEvt`) — never on a count of kicks, which is what the scene used to do.

const TAU = Math.PI * 2;

export const STEP = TAU / 32;     // radians of cloud spin per beat: one turn every 32 beats (12.8 s at 150 BPM)
export const DOWN = 0.5;          // the downbeat is worth this much of a beat step on top of its own — the ACCENT'S
                                  // AMPLITUDE, not a sharper accent: the same GLIDE and the same W, a bigger step.
export const TORUS_K = 0.7;       // the torus's main circle turns this much again on top of the cloud's spin
export const GAL_K = 0.9;         // the galaxy's winding rate, divided by (r + .35) so the core winds faster

// The profile. GLIDE is the share of each step the angle carries at an even speed right through the beat, so the
// cloud is never still; the rest is the accent. W is the accent's width in beats — wider is smoother and flatter.
// Swept at 150 / 90 / 160 BPM and then on the three real traces: GLIDE .20 W .40 still leaves 67 % of the beat
// under a tenth of the peak (the accent is 20x the glide); .30 / .50 still reads 50 % dead; .40 / .50 is already
// clean (max |a| 23 / 21 / 32, floor 13 / 14 / 9 %); .45 / .55 is the pick because it keeps §58's own 90 %
// completion time to the frame and lands nearest TORUS2's measured 28 % floor, which is the feel the user calls
// their favourite. `hooks.nudge(g, w)` / `&nudge=<g>,<w>` under #test moves both live, so the next A/B is one page
// and not one build.
export const K = { GLIDE: 0.45, W: 0.55 };
export const lead = () => K.W / 2;   // beats: the accent starts here before the line and so peaks ON it

// The accent's cumulative on [0, W]: the integral of (1/W)(1 + cos(2 pi x / W)) is x/W + sin(2 pi x / W)/(2 pi),
// written on x = u/W - 1/2 so that B(0) = 0 and B(W) = 1.
function accent(u) {
  if (u <= 0) return 0;
  if (u >= K.W) return 1;
  const x = u / K.W - 0.5;
  return x + 0.5 + Math.sin(TAU * x) / TAU;
}
// The share of beat m's step that has landed at phase u: the glide's own ramp plus the accent's.
export function phi(u) {
  return K.GLIDE * u + (1 - K.GLIDE) * accent(u);
}
// ... and its derivative in steps per beat, which is what the ruler and `dinfo()` read.
export function phiDot(u) {
  return K.GLIDE + (1 - K.GLIDE) * (u > 0 && u < K.W ? (1 + Math.cos(TAU * (u / K.W - 0.5))) / K.W : 0);
}

// The bar LINE in beat-count units, on synapse's own grid: `barPos` is the position inside the bar in beats, so the
// continuous beat position minus it is the count of the bar's first beat. Used only to ask whether the beat about to
// be nudged is a downbeat — never accumulated, because `barPos` and `beatCount` are published by different stages
// (§56: "the bar phase is the count's mod 4 wherever synapse is not sure") and a half-beat disagreement between them
// must not be able to add a downbeat's worth of angle twice.
export function barIndex(MS) {
  return Math.round((MS.beatCount + MS.beatPhase - MS.barPos) / 4);
}

// A clock RE-SEAT moves the beat POSITION, not just the count: §56 sets a whole-beat offset at the flip, §59's
// lattice check advances the line by half a beat, and `Clock.read()` publishes a forward jump as it comes. Measured
// on the three page traces (|advance - rate·dt| per frame): SeeYouDrop 20-110 s has THREE +0.5 beat moves (22.00,
// 29.02, 30.40 s — a cold start 12 s into the track lands on the wrong lattice and the check walks it back),
// CyborgNinja 20-80 s has none, Vienna has six. §58's ease absorbed them silently because it only ever travelled a
// fraction of the way to its target; a closed form would deliver half a step on ONE frame, which measured 605 rad/s^2
// — three times the jerk this step exists to remove. So the excess goes into an offset that is given back under a
// RATE LIMIT: the angle is continuous and the line is back on the clock's within a second. A time constant was
// tried first and rejected — an exponential's own first frame still delivered 0.065 beat (max |a| 393, v 7.2),
// because what matters is not how long the catch-up takes but how fast the beat PHASE may run while it happens.
// At BLEED the phase runs 50 % fast at worst, so the accent is that much taller and nothing jumps. The offset always
// reaches zero, so it cannot accumulate and the no-drift rule survives.
export const JUMP = 1.05;         // the gate is this many times the frame's OWN expected advance (dt · bpm / 60), so
                                  // a frame may never carry more beat phase than its own tempo says, plus 5 % of slack
                                  // for the clock's rounding. Two looser gates were measured and rejected: a fixed
                                  // 0.25 beat (max |a| 391 on a half-beat re-seat, whatever the bleed did) and 3x the
                                  // frame's own advance (238) — both let the excess through ON the accent's peak,
                                  // where the profile's own gain is 2/W, and that IS the spike.
export const BLEED = 0.75;        // beats/s: how fast the offset is given back (a half-beat re-seat in 0.67 s)

export function mkSpin() { return { ang: 0, last: 0, m: NaN, step: STEP, down: -9, downM: -9, u: 0, v: 0, raw: NaN, off: 0, jumps: 0 }; }

// One frame. `S.ang` is the angle, exact: a sum of whole steps plus this beat's own PHI(u). Only the re-seat offset
// above uses dt, and it decays to zero, so two runs at different frame rates land on the same angle — §57's
// no-drift rule, kept.
export function spin(S, MS, dt) {
  const raw = (MS.beatCount || 0) + (MS.beatPhase || 0);
  if (S.raw === S.raw) {
    const lim = Math.max(1e-4, JUMP * (dt > 0 ? dt : 0) * (MS.bpm || 150) / 60);
    const d = raw - S.raw, keep = d < 0 ? 0 : d > lim ? lim : d;
    if (d !== keep) { S.off += d - keep; S.jumps++; }
  }
  S.raw = raw;
  if (S.off !== 0) { const k = BLEED * (dt > 0 ? dt : 0); S.off = S.off > 0 ? Math.max(0, S.off - k) : Math.min(0, S.off + k); }
  const bp = raw - S.off + lead();
  const m = Math.floor(bp), u = bp - m;
  if (!(S.m === S.m)) S.m = m;                    // the first frame: start here
  let dm = m - S.m;
  // A clock re-seat moves the count by many beats at once (§56 sets a whole-beat offset at the flip; §59's lattice
  // check advances it by up to one). The angle must never spin up to catch it: more than two beats at once is a new
  // line, not motion, and counts as one nudge.
  if (dm > 2) dm = 1;
  if (dm > 0) {
    S.ang += S.step * dm;                         // PHI(1) = 1 exactly, so the finished beats are whole steps
    const b = barIndex(MS);
    // the downbeat's bigger step, at most once in three beats so a wobbling bar line cannot double it
    const isDown = b !== S.down && m - S.downM >= 3;
    if (isDown) { S.down = b; S.downM = m; }
    const st = STEP * (1 + (isDown ? DOWN : 0));
    // The step is the SCALE on this beat's whole profile, so changing it moves the angle by (dstep · PHI(u)) — at a
    // tick PHI(u) is ~0 and that is nothing, but a bar line that wobbles under a re-seat can land one mid-beat and
    // half a step is 8 degrees of instant turn. The accumulator absorbs the difference, so the angle is continuous
    // whatever the bar line does; what it costs is that the window's total is the design total only to that amount.
    if (st !== S.step) { S.ang -= (st - S.step) * phi(u); S.step = st; }
    S.m = m;
  }
  S.u = u;
  S.v = S.step * phiDot(u) * (MS.bpm || 150) / 60;      // rad/s, for the ruler: the angle's own velocity
  // PHI is monotone and `ang` only grows, so this guard is a no-op in normal running; it exists because a clock that
  // re-publishes a lower phase (`Clock.read()` pins the phase to 0 while the count catches up) must not make the
  // cloud turn BACKWARD for a frame, which is the most visible snap of all. §58's ease could and did.
  const out = S.ang + S.step * phi(u);
  if (out > S.last) S.last = out;
  return S.last;
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
