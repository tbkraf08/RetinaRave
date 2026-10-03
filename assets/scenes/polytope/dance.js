// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// POLYTOPE — how the figure moves to the grooves (brief-polytope-dance spec 2; the user: "how can this shape dance
// to the music?"). The port of TORUS2's motion.js `turn`, with an impulse per onset on top.
//
// The two invariant planes of the SO(4) double rotation each get a LOCK and a NUDGE. The lock is a target angle read
// off the beat COUNT — xy one full turn per 16 beats, zw one per 32 — so it can never drift, however long the set
// runs; the angle eases to it the short way round with a ~0.3 s time constant, which makes each beat a spring rather
// than a steady spin (TORUS2, DECISIONS §36 (4)). The nudge is a CRITICALLY DAMPED impulse per entry in that plane's
// train: x'' + 2w x' + w^2 x = 0 with the velocity set to KICK_* x amplitude at the hit, so the figure lurches,
// overshoots and settles back to exactly zero net — the groove is visible in the turn and the 16-beat lock holds.
// Integrated in closed form, not by Euler: x(t) = (x + c t) e^-wt with c = v + w x, so the motion is identical at
// any frame rate and bit-identical on the fake clock.
//
// The xw plane is different: it is the one that carries a cell THROUGH the projection pole, so it drifts as it
// always did (0.04 flowHigh) and takes only a small impulse and the bass wobble.
//
// POLE SAFETY (and where this departs from the brief). The brief asked for the xw excursion to be clamped so that
// `1 - w` stays above the gate for every vertex, computed from the vertex nearest the pole after the xy/zw rotation.
// Measured in node (tools/work/pole.js) that is not achievable and never was: the 24-cell, the 600-cell and the
// 120-cell each have a vertex that reaches `1 - w` = 0 EXACTLY under the xy/zw rotation alone, before any xw angle
// exists — only the tesseract keeps a floor (0.2929 = 1 - 1/sqrt2, itself above the 0.24 gate). A clamp written
// against that margin would pin the xw angle at zero for most of every bar and kill the plane.
//
// What is achievable, and is the thing the brief actually wants ("nothing crosses the pole gate on hats alone"), is
// a bound on how far the excursion can move ANY vertex: with the xy/zw rotation done, a vertex's w-coordinate under
// the xw turn is R sin(a + phi) with R = hypot(x, w) <= 1, so |d/da| <= 1 and, by the mean value theorem,
//
//     |den(a) - den(0)|  <=  |a|  for every vertex.
//
// Cap the excursion (impulse + wobble) at XWMAX and the theorem follows: NO VERTEX OUTSIDE den = GATE + XWMAX CAN BE
// PUT INSIDE THE GATE BY THE DANCE. The drift keeps today's freedom, the timed sweep of spec 3 is the one thing
// allowed to cross on purpose, and the cap costs not one per-vertex operation. tools/test_polytope.js checks the
// inequality numerically over 400 rotations x 3 polytopes; the 600-frame log is in docs/workers/polytope-dance.md.

const TAU = Math.PI * 2;

// --- the manual settings (a named constant at the top, never a magic number below) ---
export const TURNTC = 0.3;     // seconds: the lock's spring, as TORUS2's (hush/calm double it)
export const OMEGA = 12;       // 1/s: the nudge's critical damping — peak at 1/w = 83 ms, spent by 4/w = 330 ms
// A nudge's peak angle is KICK/(w e) — 0.031 rad per unit of KICK. Lean 13 asks for the groove to be VISIBLE at
// arm's length: a full-strength bass onset lurches the xy plane by 0.31 rad (18°, four fifths of the sixteenth of a
// turn the lock advances per beat) and a typical one by about 0.1 rad. Retune here.
export const KICK_XY = 10.0;   // rad/s of velocity per unit bass amplitude (peak angle = KICK/(w e) = 0.307 rad)
export const KICK_ZW = 7.0;    // ... per unit mid amplitude (peak 0.215 rad)
export const KICK_XW = 1.8;    // ... per unit high amplitude (peak 0.055 rad — the pole plane; 0.055 + WOBBLE < XWMAX)
export const BOUNCE = 0.05;    // the beat thump: 5 % of the size, visible (TORUS2's number, the user's own)
export const BREATH = 0.02;    // +-2 % over the bar, so silence still moves
export const WOBBLE = 0.12;    // rad of extra xw angle at bass 1 — the near cells bulge toward the viewer
export const WOBTC = 0.2;      // seconds: the wobble's ease
export const DRIFTXW = 0.04;   // today's 0.04 * flowHigh drift, unchanged
export const XWMAX = 0.18;     // rad: the hard cap on impulse + wobble (see POLE SAFETY above)
export const SWEEPB = 1;       // beats the inside-out sweep takes — one beat, on the musical clock (= 60/bpm s)
export const SWEEP_MIN = 4;    // beats that must pass before another sweep may be cued
export const SWEEPTOL = 0.02;  // how far below the best reach a vertex may be and still be a sweep candidate

// the live numbers, read by index.js and published by hooks.motion()
// a1/a2 are the TOTALS the scene rotates by (lock + nudge); lock1/lock2 are the eased 16- and 32-beat locks alone.
export const U = { a1: 0, a2: 0, a3: 0, lock1: 0, lock2: 0, a1T: 0, a2T: 0, nudge1: 0, nudge2: 0, drift: 0, exc: 0, bounce: 0, breath: 0, wobble: 0, sweep: 0, sweepA: 0 };

const XY = [0, 0];   // [angle, velocity] of the nudge in each plane
const ZW = [0, 0];
const XW = [0, 0];
let wob = 0;
let swStart = -1e9, swAmp = 0;   // the sweep: the beat it was cued on and the xw delta it drives

export function reset() {
  for (const k in U) U[k] = 0;
  XY[0] = XY[1] = ZW[0] = ZW[1] = XW[0] = XW[1] = 0;
  wob = 0;
  swStart = -1e9;
  swAmp = 0;
}

// one exact step of x'' + 2w x' + w^2 x = 0 (critically damped): x(t) = (x + c t) e^-wt, c = v + w x
function imp(st, dt) {
  const c = st[1] + OMEGA * st[0], e = Math.exp(-OMEGA * dt);
  st[0] = (st[0] + c * dt) * e;
  st[1] = (st[1] - OMEGA * c * dt) * e;
}

// one eased step toward a target angle, the short way round (TORUS2's motion.js turn)
function ease(cur, target, dt, tc) {
  let d = target - cur;
  d -= TAU * Math.floor(d / TAU + 0.5);
  return cur + d * (1 - Math.exp(-dt / tc));
}

// the hard bound of POLE SAFETY: whatever the dance wants of the xw plane, it may not move a vertex's den by more
// than XWMAX. Exported so tools/test_polytope.js can check the inequality against the real vertex tables.
export const clampXW = (want) => (want > XWMAX ? XWMAX : want < -XWMAX ? -XWMAX : want);

// An entry in a train arrived: set the velocity of that plane's nudge. band 0 = bass -> xy, 1 = mid -> zw,
// 2 = high -> xw. The velocity is SET, not accumulated, so a dense train cannot wind the figure up.
export function hit(band, amp) {
  if (band === 0) XY[1] = KICK_XY * amp;
  else if (band === 1) ZW[1] = KICK_ZW * amp;
  else XW[1] = KICK_XW * amp;
}

// spec 3: cue an inside-out sweep. `delta` is the xw angle that carries a vertex through the pole (poly4's
// sweepTarget). Refused inside SWEEP_MIN beats of the last one; `force` is hooks.sweep(). Returns 1 if it took.
export function sweepFire(beatNow, delta, force) {
  if (!force && beatNow - swStart < SWEEP_MIN) return 0;
  swStart = beatNow;
  swAmp = delta;
  return 1;
}

// how far through a sweep we are, 0 outside one — this is the `sweep` parameter (spec 7)
export function sweepProgress(beatNow) {
  const u = (beatNow - swStart) / SWEEPB;
  return u > 0 && u < 1 ? u : 0;
}

// The angle the sweep asks of the xw plane: a bump that is zero at both ends with zero slope there, so the plane
// leaves and rejoins its drift without a kink, and peaks at the half beat — the instant the chosen vertex sits on
// the pole, the cell blows up through the existing gate and the cage reads inside out. It is added AFTER the
// XWMAX cap because it is the one move in the scene allowed to cross (POLE SAFETY above).
export function sweepAngle(beatNow) {
  const u = (beatNow - swStart) / SWEEPB;
  if (!(u > 0 && u < 1)) return 0;
  const sn = Math.sin(Math.PI * u);
  return swAmp * sn * sn;
}

// One frame. IN: {turnT, zwT, flowHigh, bass, slow, beatPhase, barPos, sweep} — `sweep` is spec 3's deliberate
// crossing in radians, added AFTER the cap because it is the one move allowed through the pole.
export function step(dt, IN) {
  const tc = TURNTC * (1 + IN.slow);
  imp(XY, dt);
  imp(ZW, dt);
  imp(XW, dt);
  U.a1T = IN.turnT;
  U.a2T = IN.zwT;
  U.lock1 = ease(U.lock1, U.a1T, dt, tc);
  U.lock2 = ease(U.lock2, U.a2T, dt, tc);
  U.nudge1 = XY[0];
  U.nudge2 = ZW[0];
  U.a1 = U.lock1 + XY[0];
  U.a2 = U.lock2 + ZW[0];
  // the bass carries the near cells toward the pole: a small, eased, one-sided lean in the xw plane
  wob += (WOBBLE * IN.bass - wob) * (1 - Math.exp(-dt / WOBTC));
  U.wobble = wob;
  U.drift = DRIFTXW * IN.flowHigh;
  U.exc = clampXW(XW[0] + wob);
  U.sweepA = IN.sweep;
  U.sweep = IN.sweepU;
  U.a3 = U.drift + U.exc + IN.sweep;
  // (d) the thump: max(0, cos)^4 is a kick on the beat, not a sine — and (e) the bar's breath, alive in silence
  U.bounce = BOUNCE * Math.pow(Math.max(0, Math.cos(TAU * IN.beatPhase)), 4);
  U.breath = BREATH * Math.sin(TAU * IN.barPos / 4);
  return U;
}

export function motion() {
  return JSON.stringify({
    a1: +U.a1.toFixed(4), a1T: +U.a1T.toFixed(4), lock1: +U.lock1.toFixed(4), nudge1: +U.nudge1.toFixed(4),
    a2: +U.a2.toFixed(4), a2T: +U.a2T.toFixed(4), nudge2: +U.nudge2.toFixed(4),
    a3: +U.a3.toFixed(4), drift: +U.drift.toFixed(4), exc: +U.exc.toFixed(4), wobble: +U.wobble.toFixed(4),
    sweep: +U.sweep.toFixed(4), sweepA: +U.sweepA.toFixed(4),
    bounce: +U.bounce.toFixed(4), breath: +U.breath.toFixed(4),
  });
}
