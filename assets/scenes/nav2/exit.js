// NAV2 outside the set: the drop (the one declared cut), EXT/HOME on the exterior potential, and the bridge home.
// Split out of nav2.js at the 500-line hard cap — and it is the right seam anyway, because nothing here touches the
// multiplier chart: the interior half navigates by rho = |lambda|, this half by the Green's potential log2 G.
// Imports only math/*, so nav2.js -> exit.js -> field.js is a chain, never a cycle (tools/check.js fails on cycles).
// The two motion limits both halves share live here, since this is the module the other one imports.
import { clamp, mix } from '../../math/util.js';
import { findCycle, pot, potGrad, rayTo, cleanLine, mkCyc, N_MAX } from '../../math/field.js';
import { DET } from './detect.js';   // detect.js imports math/util alone, so this stays a chain, never a cycle

export const V_MAX = 1.2;        // units/s — the hard speed cap (0.02/frame at 60 Hz, 0.05 at the loop's 1/24 s cap)
export const FLOW_CAP = 0.1;     // s of musical time a single frame may advance an ema (a resume must not jump one)
// --- the drop ---------------------------------------------------------------------------------------------
export const DROP_A = -2.2;      // NAV's depth (nav.js:74): log2 G = DROP_A + DROP_B*dropStrength
export const DROP_B = 1.7;
export const LG_LO = -11.9;      // the potential's own bounds (math/mandel.js LG_MIN / LG_MAX: NAV's reach range)
export const LG_HI = 0.9;
export const DROP_ROT = 0.131;   // rad (7.5 deg) — the retry when a sample of the segment is not outside M
export const DROP_TRIES = 13;    // +-45 deg of retries: a 1.8-unit ray from near the set grazes a dendrite more often than
                                 // not, and the drop must ALWAYS happen, so the least bad direction is taken if none is
                                 // clean. The ray's own budget (RAY_T0/RAY_TMAX/RAY_BIS/RAY_N) is in math/field.js
// --- outside ----------------------------------------------------------------------------------------------
export const W_EXT = 3.0;        // 1/s — how fast c walks onto the target equipotential
export const DRIFT_EXT = 0.07;   // units of equipotential drift per second of MUSICAL time
export const HOME_TAN = 0.9;     // units/s the drift is unwound at
export const HOME_EPS = 0.004;   // |drift| that counts as unwound
export const HOME_LG = 0.05;     // |log2 G - the exit potential| that counts as arrived
export const HOME_TRIES = 240;   // frames of trying for a clean bridge before taking the one we have
export const V_IN = 1.1;         // units/s along the bridge home (under V_MAX: the bridge is a normal frame)
export const BUMP_LG = 1.5;      // log2 G the beat pulls the exterior target IN by (v0.13): outside the set the dust
                                 // condenses toward it on every kick, so the edge bumps with the beat out here too

const TR = mkCyc(), PG = { x: 0, y: 0 };

export const cpy = (a, b) => {
  a.has = b.has; a.q = b.q; a.zr = b.zr; a.zi = b.zi; a.lr = b.lr; a.li = b.li;
  a.rho = b.rho; a.arg = b.arg; a.eps2 = b.eps2; a.res = b.res; a.n = b.n;
};

// The one cut. Walk the rho-normal outward to the target potential (math/field.js rayTo), check the segment is clean
// (cleanLine), jump. The straight normal often fails the check — the antenna and the dendrites are in the way — so the
// direction is retried over +-45 degrees and the least bad one is taken if none is clean.
export function doDrop(N, S, now) {
  if (N.mode !== 'INT') {
    N.extBeat = S.beatCount;
    N.timeScale = 2.6;
    return;
  }
  const lgT = clamp(DROP_A + DROP_B * S.dropStrength, LG_LO, LG_HI), x = N.cPath[0], y = N.cPath[1];
  let bt = 0, bd = 0, be = 0, bb = 1e9, bk = -1;
  for (let k = 0; k < DROP_TRIES; k++) {
    const a = k === 0 ? 0 : ((k & 1) ? 1 : -1) * DROP_ROT * Math.ceil(k / 2);
    const ca = Math.cos(a), sa = Math.sin(a);
    const dx = N.n[0] * ca - N.n[1] * sa, dy = N.n[0] * sa + N.n[1] * ca;
    const t = rayTo(x, y, dx, dy, lgT);
    if (!(t > 0)) continue;
    const bad = cleanLine(x, y, dx, dy, t);
    if (bad < bb) {
      bb = bad;
      bt = t;
      bd = dx;
      be = dy;
      bk = k;
    }
    if (!bad) break;
  }
  if (!(bt > 0)) {
    N.log('DROP2@' + now.toFixed(2) + ' the ray never reached log2G ' + lgT.toFixed(2) + ': staying inside');
    return;
  }
  N.cIn[0] = x;
  N.cIn[1] = y;
  cpy(N.cyIn, N.cy);
  N.cOut[0] = N.cPath[0] = x + bd * bt;
  N.cOut[1] = N.cPath[1] = y + be * bt;
  N.segL = bt;
  N.pathCut = 0;
  N.mode = 'EXT';
  N.lgExit = lgT;
  N.drift = 0;
  N.homeTry = 0;
  N.extBeat = S.beatCount;
  N.timeScale = 2.6;
  N.cy.has = N.cyc.has = 0;
  N.par = 0;
  N.gate.on = 0;
  N.log('DROP2@' + now.toFixed(2) + ' lg ' + lgT.toFixed(2) + ' t ' + bt.toFixed(4) + ' try ' + bk + ' bad ' + bb);
}

// EXT / HOME follow grad log2 G: the normal carries c onto the target equipotential, the tangent drifts along it in
// musical time. HOME unwinds that drift and returns to the exit potential, which is (to the frame's accuracy) the
// point the drop landed on — so the bridge home starts where c already is and nothing jumps.
// The settle rule is NAV's, verbatim (nav.js:206): arc not 'peak' and 8 beats away, or 48 beats, or silence.
export function stepExt(N, dt, S) {
  const dflow = clamp(S.flow - N.flow0, 0, FLOW_CAP), away = S.beatCount - N.extBeat;
  N.flow0 = S.flow;
  if (N.mode === 'EXT' && S.dropEnv < 0.2 &&
    ((S.arc !== 'peak' && away > 8) || away > 48 || S.presence < 0.15)) N.mode = 'HOME';
  const lg = pot(N.cPath[0], N.cPath[1]);
  potGrad(N.cPath[0], N.cPath[1], PG);
  const gm = Math.sqrt(PG.x * PG.x + PG.y * PG.y) || 1e-9, gx = PG.x / gm, gy = PG.y / gm;
  let lgT, tv;
  if (N.mode === 'EXT') {
    // NAV's `reach` expression, inline (it is not a parameter here — six is the cap, and the four visible ones won)
    lgT = clamp(mix(-2.6, -9, clamp(0.55 * S.eS + 0.5 * S.tension, 0, 1)) + 3.2 * S.dropEnv - BUMP_LG * DET.bump, LG_LO, LG_HI);
    tv = DRIFT_EXT * dflow / Math.max(dt, 1e-5);
  } else {
    lgT = N.lgExit;
    tv = clamp(-N.drift / Math.max(dt, 1e-5), -HOME_TAN, HOME_TAN);
  }
  let vx = W_EXT * (lgT - lg) / gm * gx - tv * gy, vy = W_EXT * (lgT - lg) / gm * gy + tv * gx;
  const sp = Math.sqrt(vx * vx + vy * vy);
  if (sp > V_MAX) {
    vx *= V_MAX / sp;
    vy *= V_MAX / sp;
  }
  N.drift += (vy * gx - vx * gy) * dt;
  N.cPath[0] += vx * dt;
  N.cPath[1] += vy * dt;
  N.lg = lg;
  N.cy.has = N.cyc.has = 0;
  N.par = 0;
  if (N.mode !== 'HOME') return;
  N.homeTry++;
  if (!(Math.abs(N.drift) < HOME_EPS && Math.abs(lg - lgT) < HOME_LG)) return;
  const ux = N.cPath[0] - N.cIn[0], uy = N.cPath[1] - N.cIn[1], ul = Math.sqrt(ux * ux + uy * uy);
  if (!(ul > 1e-9)) return;
  if (cleanLine(N.cIn[0], N.cIn[1], ux / ul, uy / ul, ul) !== 0 && N.homeTry < HOME_TRIES) return;
  N.cOut[0] = N.cPath[0];
  N.cOut[1] = N.cPath[1];
  N.segL = ul;
  N.mode = 'IN';
  N.s = 1;
}

// `land` is nav2.js's own committer, passed in: exit.js must not import from nav2.js or check.js fails on the cycle.
export function stepIn(N, dt, S, land) {
  N.s = clamp(N.s - V_IN * dt / Math.max(N.segL, 1e-9), 0, 1);
  N.cPath[0] = mix(N.cIn[0], N.cOut[0], N.s);
  N.cPath[1] = mix(N.cIn[1], N.cOut[1], N.s);
  N.par = 1 - N.s;
  N.cy.has = N.cyc.has = 0;
  if (N.s > 0) return;
  N.mode = 'INT';
  findCycle(N.cIn[0], N.cIn[1], TR, N_MAX);     // a rare off-frame seek: the full bound, the pre-drop cycle warm
  if (TR.has) land(N, N.cIn[0], N.cIn[1], TR);
  else land(N, N.cIn[0], N.cIn[1], N.cyIn);
  N.ySp.set(N.cIn[1]);
  N.xE = N.cIn[0];
  N.landed = S.beatCount;
  N.homeTry = 0;
  N.gate.on = N.gate.press = 0;
}
