// NAV2's detectors (docs/workers/brief-nav2.md §3): pure followers of MS, no wall clock, no Math.random. Every
// constant is a named manual setting at the top of this module — these are the leans the user retunes first.
//
// pitch    only the MOTION of the spectral centroid lifts the blob (a bright mix must not park it high)
// sweep    a filter sweep / riser over seconds: riser, hp, or the centroid's own climb
// roll     a drum roll / snare build: MS.roll, or the onset rate above a floor (real audio only)
// scratch  "that dj scratch sound": a fast pitch BEND whose sign FLIPS, gated on spectral flux and hit energy
// swirl    the soft-OR of the three: what the user hears as "a swirl"
// wind     the pre-drop wind-up, on synapse's drop countdown (NOT `build` alone); a drop RELEASES it, a fake-out does not
// spin     the frame's turn rate: the swirl plus the square of the wind, released by the drop
import { clamp, ema } from '../../math/util.js';

export const PITCH_K = 2.5;      // gain from centroid motion to pitch height
export const C_TAU = 4.0;        // s — the centroid's own long mean: the high-pass that makes pitch a motion
export const TR_TAU = 0.12;      // s — the short ema the centroid's derivative is read through
export const TR_SC = 0.12;       // centroid units/s that count as a full sweep
export const SW_A = 0.25;        // s — sweep attack
export const SW_R = 0.60;        // s — sweep release
export const RO_A = 0.30;        // s — roll attack
export const RO_R = 0.80;        // s — roll release
export const OR_LO = 5.0;        // onsets/s below which a roll is not a roll
export const OR_SC = 6.0;        // onsets/s from that floor to a full roll
export const SCR_SLEW = 0.55;    // |pitch velocity| (units/s) above which a move is a BEND
export const SCR_TAU = 0.35;     // s — the flick counter's own decay
export const SCR_N0 = 1.5;       // flicks/s below which nothing is a scratch
export const SCR_NS = 2.5;       // flicks/s from there to a full scratch
export const SCR_GATE = 0.35;    // the gate's floor: a scratch needs energy behind it
export const FLUX_TAU = 2.0;     // s — the self-normalising peak the flux gate divides by
export const WIND_BEATS = 8.0;   // beats of countdown over which the wind-up builds
export const W_TAU = 0.40;       // s — the wind's own ema
export const W_FAKE = 2.5;       // s — after a fake-out the tension LEAKS out instead of releasing
export const FAKE_HOLD = 0.5;    // s (one beat at 124 bpm) the slow ema is held after a fake-out
export const REL_TAU = 0.45;     // s — the release follower of dropEnv
export const SPIN_SW = 0.6;      // rad/s per unit swirl
export const SPIN_W = 0.5;       // rad/s per unit wind^2
export const SPIN_SC = 0.6;      // rad/s per unit scratch (scratch is not an MS field, so it cannot live in the param)
export const SPIN_TAU = 0.25;    // s — the rate's own ease, so the angle's derivative never jumps
export const SPIN_REL = 0.8;     // how much of the rate the drop's release takes away
export const LIFT_TAU = 0.20;    // s — the blob's float ease
export const LIFT_V = 0.35;      // view units of float per unit of pinned pitch (hooks.pitch)
export const LIFT_G = 2.5;       // gain on the HIGH-PASSED lift target: the param's range is the level's, this is the motion's
export const SLIDE = 0.45;       // Koenigs band shift per unit pitch (uKoen.x)
export const SLIDE_A = 1.10;     // Koenigs spoke rotation per unit pitch, radians (uKoen.y)
export const CURL = 0.35;        // gain on the natural tightness per unit wind (uCurl)
export const CURL_SW = 0.30;     // ... and per unit swirl
export const GLOW_H = 0.8;       // how much the smoulder brightens in the hush (uGlow = 1 + GLOW_H*hush)

export const DET = {
  pitch: 0.5, pE: 0, lift: 0, sweep: 0, roll: 0, scratch: 0, swirl: 0,
  wind: 0, windT: 0, count: 0, spin: 0, rate: 0, angle: 0, rel: 0, curl: 0, glow: 1,
  cEma: 0, cPrev: -1, cTr: 0, lEma: 0, pvPrev: 0, bendSgn: 0, flicks: 0, fluxPk: 1e-6, hitF: 0,
  fake: 0, dir: 1, seeded: 0,
  pinPitch: -1, pinScratch: -1, pinSwirl: -1, pinWish: null,
};

// The pitch source for the scratch: the faster of the centroid and the strongest partial's octave.
function pitchSrc(S) {
  const pk = S.peaks && S.peaks[0] ? S.peaks[0][0] : 0;
  return pk > 30 ? Math.log2(pk / 55) / 6 : S.centroid;
}

export function resetDet() {
  const D = DET;
  D.pitch = 0.5;
  D.pE = D.lift = D.sweep = D.roll = D.scratch = D.swirl = 0;
  D.wind = D.windT = D.count = D.spin = D.rate = D.angle = D.rel = D.curl = 0;
  D.glow = 1;
  D.cEma = 0;
  D.cPrev = -1;
  D.cTr = D.lEma = D.pvPrev = D.bendSgn = D.flicks = 0;
  D.fluxPk = 1e-6;
  D.hitF = D.fake = 0;
  D.dir = 1;
  D.seeded = 0;
}

// P = the scene's visual parameters (env.params): `lift` and `spin` are declared targets, the ease below is state.
export function updateDet(dt, S, P) {
  const D = DET;
  if (D.cPrev < 0) {            // first frame: start the long means AT the signal, so nothing swings on boot
    D.cPrev = S.centroid;
    D.cEma = S.centroid;
    D.lEma = P.lift;
  }
  if (!D.seeded) {              // GROOVE's own rule for a section constant: the sign of seed.th
    D.dir = S.seed.th < 0 ? -1 : 1;
    D.seeded = 1;
  }
  // --- pitch: the motion of the centroid, not its level -------------------------------------------------
  D.cEma = ema(D.cEma, S.centroid, dt, C_TAU);
  const raw = clamp(0.5 + PITCH_K * (S.centroid - D.cEma), 0, 1);
  D.pitch = D.pinPitch >= 0 ? D.pinPitch : raw;
  const pn = 2 * (D.pitch - 0.5);
  D.pE = ema(D.pE, pn, dt, LIFT_TAU);
  // --- the blob's float: the same high-pass on the declared `lift` target, so uKoen and uView.y move together ---
  D.lEma = ema(D.lEma, P.lift, dt, C_TAU);
  D.lift = ema(D.lift, D.pinPitch >= 0 ? LIFT_V * pn : LIFT_G * (P.lift - D.lEma), dt, LIFT_TAU);
  // --- sweep: a filter sweep / riser over seconds --------------------------------------------------------
  const tr = (S.centroid - D.cPrev) / Math.max(dt, 1e-4);
  D.cPrev = S.centroid;
  D.cTr = ema(D.cTr, tr, dt, TR_TAU);
  const swT = clamp(Math.max(S.riser, S.hp, Math.abs(D.cTr) / TR_SC), 0, 1);
  D.sweep = ema(D.sweep, swT, dt, swT > D.sweep ? SW_A : SW_R);
  // --- roll: the drum roll / snare build -----------------------------------------------------------------
  const roT = clamp(Math.max(S.roll, (S.onsetRate - OR_LO) / OR_SC), 0, 1);
  D.roll = ema(D.roll, roT, dt, roT > D.roll ? RO_A : RO_R);
  // --- scratch: a bend whose sign flipped, with energy behind it -----------------------------------------
  const ps = pitchSrc(S), pv = (ps - D.pvPrev) / Math.max(dt, 1e-4);
  D.pvPrev = ps;
  const bend = Math.abs(pv) > SCR_SLEW ? (pv > 0 ? 1 : -1) : 0;
  if (bend && D.bendSgn && bend !== D.bendSgn) D.flicks += 1;   // a leaky count; flicks/s = D.flicks / SCR_TAU
  if (bend) D.bendSgn = bend;
  D.flicks = Math.max(0, D.flicks - D.flicks * dt / SCR_TAU);
  D.fluxPk = Math.max(S.flux, D.fluxPk - dt * D.fluxPk / FLUX_TAU);
  D.hitF = ema(D.hitF, Math.max(S.hitStrength, clamp(S.onsetRate / OR_SC, 0, 1)), dt, SCR_TAU);
  const gate = clamp(S.flux / Math.max(D.fluxPk, 1e-6), 0, 1) * clamp(D.hitF / SCR_GATE, 0, 1);
  const scT = clamp((D.flicks / SCR_TAU - SCR_N0) / SCR_NS, 0, 1) * gate;
  D.scratch = D.pinScratch >= 0 ? D.pinScratch : ema(D.scratch, scT, dt, SCR_TAU);
  // --- swirl: the soft-OR the user hears ----------------------------------------------------------------
  D.swirl = D.pinSwirl >= 0 ? D.pinSwirl : 1 - (1 - D.sweep) * (1 - D.roll) * (1 - D.scratch);
  // --- wind: the pre-drop wind-up on synapse's countdown ------------------------------------------------
  const dei = S.dropExpectedIn;
  D.count = clamp(1 - Math.max(dei, 0) / WIND_BEATS, 0, 1) * (dei >= 0 ? 1 : 0);
  D.windT = clamp(P.wind, 0, 1);
  if (S.fakeoutEvt) D.fake = FAKE_HOLD;
  D.fake = Math.max(0, D.fake - dt);
  if (S.dropEvt) D.wind = 0;
  else D.wind = ema(D.wind, D.windT, dt, D.fake > 0 ? W_FAKE : W_TAU);
  // --- the release, the spin rate, the angle ------------------------------------------------------------
  D.rel = ema(D.rel, S.dropEnv, dt, REL_TAU);
  D.spin = clamp(P.spin, 0, 2) + SPIN_SC * D.scratch;
  const rt = D.dir * D.spin * (1 - SPIN_REL * D.rel);
  D.rate = ema(D.rate, rt, dt, SPIN_TAU);     // the RATE is eased, so the angle integrates and never jumps
  D.angle += D.rate * dt;                     // on dt, not musical time: the param's range is declared in rad/s
  // --- the shader gains --------------------------------------------------------------------------------
  D.curl = CURL * D.wind + CURL_SW * D.swirl;
  D.glow = 1 + GLOW_H * S.hush;
}
