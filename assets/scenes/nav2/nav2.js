// NAV2's navigator (docs/workers/brief-nav2.md §1): "the melody draws the path". c is never looked up in a table and
// never walks a chart — it is a ball rolling inside M under three forces.
//   the melody's pull  pitch height is Im c (a critically damped spring), the spectral balance is Re c (an ema in
//                      MUSICAL time, so silence freezes it); the pull loosens while a build winds up
//   the wall           rho = |lambda| of the attracting cycle, found chart-free every frame (math/field.js); rho = 1 IS
//                      the boundary. An outward step is projected onto the rim's tangent and bisected to the largest
//                      step still inside, so c SLIDES along the rim, and the period must not change (see probe())
//   the wind-up        as `wind` rises the ball is PRESSED to the rim: rho -> 1 and the Koenigs arms tighten by
//                      construction, their tightness being arg lambda / ln|lambda|
// Gates: a step the wall refused, held half a beat near internal angle p/q (Farey, q <= 7), walks c THROUGH the root
// into the child bulb, and the finder re-verifies with period q*k; internal angle 0 runs it backwards, out to the
// parent. No Misiurewicz table, no kick: state.kick.x is 0 for ever. The drop is the ONE cut: a ray along the
// rho-normal out to log2 G = -2.2 + 1.7*dropStrength, its segment checked clean, pathCut 0, mode EXT. Every other
// frame moves cPath by at most V_MAX*dt, well under the continuity monitor's 0.06 spike rule.
import { TAU, clamp, mix, sstep, ema, Spring } from '../../math/util.js';
import { findCycle, rhoGrad, pot, potGrad, rayTo, cleanLine, nearestRational, mkCyc, N_ITER, N_MAX } from '../../math/field.js';
import { DET } from './detect.js';

// --- the melody's wishes (index.js declares `height` / `side` / `lift` from these) -------------------------
export const Y_AMP = 1.3;        // Im c per unit of centroid above/below the middle: UP IS UP
export const X_HOME = -0.8;      // Re c the balance drifts around
export const X_AMP = -1.1;       // Re c per unit of (bass - high): NEGATIVE, so bass-heavy drifts LEFT to the cascade
export const LIFT = 0.65;        // view units of blob float per unit of centroid off 0.45 (capped by `lift`'s +-0.3 range)
export const W_Y = 14;           // rad/s — the pitch spring, ~0.3 s settle
export const TAU_X = 1.2;        // musical seconds — the Re bias's ema (~8 real seconds in a #test valley, frozen in silence)
export const FLOW_CAP = 0.1;     // s of musical time a single frame may advance the Re bias (a resume must not jump it)
// --- the forces -------------------------------------------------------------------------------------------
export const TAU_M = 0.55;       // s — the melody's pull: v = (wish - c)/TAU_M
export const LOOSE = 0.8;        // how much of the pull a full wind-up takes away
export const V_MAX = 1.2;        // units/s — the hard speed cap (0.02/frame at 60 Hz, 0.05 at the loop's 1/24 s cap)
export const BIS = 6;            // bisections to the largest step still inside
export const RHO_CAP = 0.985;    // the wall (float32 uC quantisation; above this the picture stops changing)
export const RHO_FREE = 0.72;    // where the ball rests with no wind. 0.72 settles c in the period-2 disc, the brightest
                                 // resting place tried (lum.py centre at f360: 0.078, vs 0.035 at 0.60 and NAV's 0.29)
export const K_R = 4.0;          // units/s per unit of (rhoT - rho): the wind's pressure toward the rim
export const K_BACK = 1.2;       // ... and the always-on restoring push when rho is ABOVE the target. Without it the melody
                                 // parks c on the rim, where ln|lambda| -> 0 makes the bands sub-pixel and the interior black
export const K_HIT = 0.35;       // a hit pushes rhoT transiently (the only thing left of NAV's kick)
export const PAR_LO = 0.8;       // the smoulder's window in rho (NAV's, chart-free)
export const PAR_HI = 0.98;
// --- the gates --------------------------------------------------------------------------------------------
export const GATE_Q = 7;         // the largest denominator the Farey address will name
export const GATE_W = 0.02;      // gate width in turns, divided by q
export const GATE_RHO = 0.004;   // rho this near the cap counts as pressed even if the step was not blocked
export const GATE_RHO_MIN = 0.93;// ... and a blocked step only counts as pressure this near the rim
export const GATE_HOLD = 0.5;    // beats of held pressure before the cap opens
export const GATE_BUILD = 0.4;   // a wind-up must never change component: no gate while build is above this
export const SIZE_MIN = 0.02;    // the child must be at least this big in c to be worth entering
export const GATE_C = 1;         // child-size proxy: GATE_C*sin(pi p/q)/q^2 / |dlambda/dc| (0.25 at the 1/2 root = its radius)
export const GATE_TOL = 1e-3;    // |lambda - e^{2pi i p/q}| at which we call ourselves AT the root
export const GATE_PUSH = 1.0;    // child sizes to push past the root
export const GATE_WALK = 0.9;    // units of walking toward a root before the gate gives up
export const GATE_CAP = 0.99995; // the cap while a gate is open (the root itself has rho = 1)
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

const TR = mkCyc(), BE = mkCyc(), GR = { gx: 0, gy: 0, dlr: 0, dli: 0, dl: 0 }, PG = { x: 0, y: 0 };
const FR = { p: 0, q: 1, err: 1 }, CD = [0, 0];
let bx = 0, by = 0, bm = 0;   // the winning probe of the frame

export const N2 = {
  mode: 'INT',
  c: [0, 0], cPath: [0, 0],
  cyc: { q: 1, lnr: -7, arg: 0, zs: [0, 0], eps2: 9e-4, has: 1 },   // the shader's view of the cycle (NAV's shape)
  cy: mkCyc(),                                                     // the cycle itself
  cyIn: mkCyc(),                                                   // the pre-drop cycle, kept warm for the return
  rho: 0, q: 1, dl: 1, dlr: 2, dli: 0, compSize: 1, n: [1, 0],
  par: 0, timeScale: 1, vtime: 0, lg: 0,
  ySp: new Spring(0, W_Y), xE: X_HOME, flow0: -1, beat0: 0,
  gate: { on: 0, ph: 0, p: 0, q: 1, exit: 0, want: 0, press: 0, pushed: 0, walk: 0, q0: 1, dx: 1, dy: 0 },
  cGood: [0, 0],         // the last point known to be interior WITH a cycle: where a wedged frame walks back to
  cIn: [0, 0], cOut: [0, 0], segL: 0, lgExit: 0, drift: 0, s: 0, extBeat: 0, landed: 0, homeTry: 0,
  path: new Float32Array(96 * 3), pathCut: 999, orbit: new Float32Array(160 * 3),
  kick: { x: 0 },        // the continuity monitor's shape; NAV2 is chart-free, so this is 0 for ever
  baby: null,            // ... and it never dives into a baby copy
  cycBase: 1, seeded: 0, xSeed: 0, blocked: 0,
  log: () => {},
};

const cdiv = (ar, ai, br, bi) => {
  const d = br * br + bi * bi || 1e-300;
  CD[0] = (ar * br + ai * bi) / d;
  CD[1] = (ai * br - ar * bi) / d;
  return CD;
};
const cpy = (a, b) => {
  a.has = b.has; a.q = b.q; a.zr = b.zr; a.zi = b.zi; a.lr = b.lr; a.li = b.li;
  a.rho = b.rho; a.arg = b.arg; a.eps2 = b.eps2; a.res = b.res; a.n = b.n;
};

// The shader reads ln|lambda| and arg lambda (the Koenigs coordinate is invariant under f^q, so the bands have no seam).
function pub(N) {
  const C = N.cyc, y = N.cy;
  C.q = y.q || 1;
  C.lnr = Math.log(Math.max(y.rho, 1e-3));
  C.arg = y.arg;
  C.zs[0] = y.zr;
  C.zs[1] = y.zi;
  C.eps2 = y.eps2;
  C.has = y.has;
}

function grad(N, x, y) {
  const g = rhoGrad(x, y, N.cy.q, N.cy.zr, N.cy.zi, GR), m = Math.sqrt(g.gx * g.gx + g.gy * g.gy);
  if (m > 1e-12) {
    N.n[0] = g.gx / m;
    N.n[1] = g.gy / m;
  }
  N.dl = g.dl;
  N.dlr = g.dlr;
  N.dli = g.dli;
  N.compSize = 1 / Math.max(g.dl, 1e-9);
}

function land(N, x, y, C) {
  N.cPath[0] = x;
  N.cPath[1] = y;
  cpy(N.cy, C);
  N.rho = C.rho;
  N.q = C.q;
  grad(N, x, y);
  pub(N);
  if (C.has) {
    N.cGood[0] = x;
    N.cGood[1] = y;
  }
}

export function resetNav2() {
  const N = N2;
  N.mode = 'INT';
  N.cPath[0] = N.c[0] = 0;
  N.cPath[1] = N.c[1] = 0;
  N.ySp = new Spring(0, W_Y);
  N.xE = X_HOME;
  N.flow0 = -1;
  N.beat0 = 0;
  N.par = 0;
  N.timeScale = 1;
  N.vtime = 0;
  N.drift = N.s = N.extBeat = N.landed = N.homeTry = 0;
  N.pathCut = 999;
  N.gate.on = N.gate.press = N.gate.pushed = N.gate.walk = 0;
  N.cGood[0] = N.cGood[1] = 0;
  N.q = 1;
  N.xSeed = 0;
  findCycle(0, 0, TR, N_MAX);
  land(N, 0, 0, TR);
  N.seeded = 1;
}

// A trial step: 1 when (cPath + s) is an interior point of THE SAME COMPONENT with an attracting cycle at or below
// `cap`. The period test is the component invariant, and it is what makes the wall a wall: rho alone leaks, because a
// step across a root can land in the NEXT component with a small rho and be accepted — c then tunnels down the
// period-doubling cascade and out of M in two seconds (measured 2026-09-25, c reached -2.04 and froze). A component is
// changed ONLY through a gate, which is exactly what the brief asks for ("a wind-up never changes component").
// The winner is kept in BE, so the search costs one findCycle per probe and one rhoGrad for the frame.
function probe(N, sx, sy, cap) {
  const x = N.cPath[0] + sx, y = N.cPath[1] + sy;
  findCycle(x, y, TR, N_ITER);
  if (!TR.has || TR.rho > cap || TR.q !== N.q) return 0;
  cpy(BE, TR);
  bx = x;
  by = y;
  return 1;
}

// The wall. An outward step is projected onto the rim's tangent, then bisected: c SLIDES along the rim.
function moveInt(N, sx, sy) {
  N.blocked = 0;
  if (probe(N, sx, sy, RHO_CAP)) return land(N, bx, by, BE);
  N.blocked = 1;   // the melody wanted out and the wall said no: THIS is the pressure a gate waits for
  const dn = sx * N.n[0] + sy * N.n[1];
  if (dn > 0) {
    sx -= dn * N.n[0];
    sy -= dn * N.n[1];
  }
  if (probe(N, sx, sy, RHO_CAP)) return land(N, bx, by, BE);
  let lo = 0, hi = 1, got = 0;
  for (let i = 0; i < BIS; i++) {
    const m = (lo + hi) / 2;
    if (probe(N, sx * m, sy * m, RHO_CAP)) {
      lo = m;
      got = 1;
      bm = m;
    } else hi = m;
  }
  if (got) return land(N, N.cPath[0] + sx * bm, N.cPath[1] + sy * bm, BE);
  // nothing tangential works (c is outside the cap after a gate push): fall inward along the normal
  const b = Math.sqrt(sx * sx + sy * sy) || 0.002;
  if (probe(N, -N.n[0] * b, -N.n[1] * b, RHO_CAP)) return land(N, bx, by, BE);
}

// The gate's own mover: cPath moves whatever the finder says, because the root itself has no attracting cycle.
function gateMove(N, sx, sy) {
  const x = N.cPath[0] + sx, y = N.cPath[1] + sy;
  N.cPath[0] = x;
  N.cPath[1] = y;
  findCycle(x, y, TR, N_ITER);
  if (TR.has) {
    cpy(N.cy, TR);
    N.rho = TR.rho;
    N.q = TR.q;
    grad(N, x, y);
  } else {
    N.cy.has = 0;
    N.rho = 1;
  }
  pub(N);
}

function gateTick(N, dt, S) {
  const G = N.gate, bt = S.beatCount + S.beatPhase, db = clamp(bt - N.beat0, 0, 1);
  N.beat0 = bt;
  if (G.on) return;
  // "Pressed against the rim" is a step the wall REFUSED this frame, not an absolute rho: where the melody's pull and
  // the wall's own restoring push balance depends on the music, and on the 1/3 root that balance sits at rho 0.974 —
  // below any fixed threshold near the cap, so a fixed threshold means the gate can never open under the melody alone
  // (measured 2026-09-25: c walked to the 1/3 root and sat there for 400 frames).
  const pressed = (N.blocked || N.rho > RHO_CAP - GATE_RHO) && N.rho > GATE_RHO_MIN;
  if (!N.cy.has || S.build >= GATE_BUILD || !pressed) {
    G.press = 0;
    return;
  }
  nearestRational(N.cy.arg / TAU, GATE_Q, FR);
  // Internal angle 0 is the component's OWN root: pressed there, the gate walks back OUT into the parent. That is the
  // same machinery with lambda -> 1, and it is what the tiny-bulb trap steers toward ("the way back out through the root").
  const exit = FR.q === 1;
  const child = exit ? GATE_C * N.compSize : GATE_C * Math.sin(Math.PI * FR.p / FR.q) / (FR.q * FR.q) / Math.max(N.dl, 1e-9);
  if (exit ? (N.q < 2 || FR.err > GATE_W) : (FR.err > GATE_W / FR.q || child < SIZE_MIN)) {
    G.press = 0;
    return;
  }
  G.press += db;
  if (G.press < GATE_HOLD) return;
  G.on = 1;
  G.ph = 0;
  G.p = FR.p;
  G.q = FR.q;
  G.exit = exit ? 1 : 0;
  G.q0 = N.q;
  G.want = child * GATE_PUSH;
  G.press = G.pushed = G.walk = 0;
  N.log('GATE ' + (exit ? 'out of' : 'into ' + FR.p + '/' + FR.q + ' from') + ' q' + N.q + ' push ' + G.want.toFixed(4));
}

function gateStep(N, dt) {
  const G = N.gate, step = V_MAX * dt;
  // The arrival test runs in BOTH phases: the walk toward the root can already cross into the child, and checking it
  // only while pushing overshoots — measured, c went 1 -> 3 -> 9 in twenty frames because the push kept going.
  const done = G.exit ? (N.q < G.q0 && G.q0 % N.q === 0) : (N.q === G.q0 * G.q);
  if (N.cy.has && N.rho <= RHO_CAP && done) {
    N.log('GATE ok q' + N.q + ' rho ' + N.rho.toFixed(4));
    G.on = 0;
    return;
  }
  if (G.ph === 0) {
    const a = TAU * G.p / G.q, er = Math.cos(a) - N.cy.lr, ei = Math.sin(a) - N.cy.li;
    if (Math.sqrt(er * er + ei * ei) < GATE_TOL || !N.cy.has) {
      G.ph = 1;
      return;
    }
    const d = cdiv(er, ei, N.dlr, N.dli), m = Math.sqrt(d[0] * d[0] + d[1] * d[1]) || 1e-12;
    G.dx = d[0] / m;
    G.dy = d[1] / m;
    const s = Math.min(step, m);
    gateMove(N, G.dx * s, G.dy * s);
    G.walk += s;
    if (G.walk > GATE_WALK) G.on = 0;
  } else {
    const s = Math.min(step, Math.max(G.want - G.pushed, 0));
    gateMove(N, G.dx * s, G.dy * s);
    G.pushed += s;
    if (G.pushed >= G.want) G.on = 0;
  }
}

function stepInt(N, dt, S, P) {
  const D = DET, dflow = clamp(S.flow - N.flow0, 0, FLOW_CAP);
  N.flow0 = S.flow;
  const pin = D.pinWish;
  N.ySp.step(pin ? pin[1] : P.height, dt, W_Y);
  if (!N.xSeed) {            // start the bias AT the signal: a first frame that creeps in from X_HOME parks c on the rim
    N.xE = pin ? pin[0] : P.side;
    N.xSeed = 1;
  }
  N.xE = ema(N.xE, pin ? pin[0] : P.side, dflow, TAU_X);
  let wx = N.xE, wy = N.ySp.x;
  // the tiny-bulb trap: in a component below 2*SIZE_MIN the Re wish becomes a pull to internal angle 0 (the way out)
  if (N.cy.has && N.compSize < 2 * SIZE_MIN) {
    const d = cdiv(1 - N.cy.lr, -N.cy.li, N.dlr, N.dli);
    wx = N.cPath[0] + d[0];
    wy = N.cPath[1] + d[1];
  }
  gateTick(N, dt, S);
  if (N.gate.on) gateStep(N, dt);
  else if (!N.cy.has) {
    // No cycle here: walk back to the last point that had one, at the same speed cap (so this is a continuous frame too)
    const dx = N.cGood[0] - N.cPath[0], dy = N.cGood[1] - N.cPath[1], m = Math.sqrt(dx * dx + dy * dy);
    if (m > 1e-9) {
      const s = Math.min(V_MAX * dt, m);
      N.cPath[0] += dx / m * s;
      N.cPath[1] += dy / m * s;
    }
    findCycle(N.cPath[0], N.cPath[1], TR, N_ITER);
    if (TR.has) land(N, N.cPath[0], N.cPath[1], TR);
    else pub(N);
  } else {
    const loose = 1 - LOOSE * D.wind;
    let vx = (wx - N.cPath[0]) / TAU_M * loose, vy = (wy - N.cPath[1]) / TAU_M * loose;
    // a hit pushes the TARGET modulus transiently. The wall is two-sided: outward only as hard as the wind presses,
    // inward always — so with nothing winding up the ball rests at RHO_FREE and the interior stays legible.
    const press = clamp(D.wind + K_HIT * S.hit, 0, 1), rhoT = mix(RHO_FREE, RHO_CAP, press);
    const dr = rhoT - N.rho, kr = dr >= 0 ? K_R * press * dr : K_BACK * dr;
    vx += kr * N.n[0];
    vy += kr * N.n[1];
    const sp = Math.sqrt(vx * vx + vy * vy);
    if (sp > V_MAX) {
      vx *= V_MAX / sp;
      vy *= V_MAX / sp;
    }
    moveInt(N, vx * dt, vy * dt);
  }
  N.par = N.cy.has ? sstep(PAR_LO, PAR_HI, N.rho) * (N.q > 1 ? 1 : 0.4) : 0;
}

// The one cut. Walk the rho-normal outward to the target potential (math/field.js rayTo), check the segment is clean
// (cleanLine), jump. The straight normal often fails the check — the antenna and the dendrites are in the way — so the
// direction is retried at +-5 degrees.
function doDrop(N, S, now) {
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
  {
    const dx = bd, dy = be, t = bt, k = bk;
    if (!(t > 0)) {
      N.log('DROP2@' + now.toFixed(2) + ' the ray never reached log2G ' + lgT.toFixed(2) + ': staying inside');
      return;
    }
    N.cIn[0] = x;
    N.cIn[1] = y;
    cpy(N.cyIn, N.cy);
    N.cOut[0] = N.cPath[0] = x + dx * t;
    N.cOut[1] = N.cPath[1] = y + dy * t;
    N.segL = t;
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
    N.log('DROP2@' + now.toFixed(2) + ' lg ' + lgT.toFixed(2) + ' t ' + t.toFixed(4) + ' try ' + k + ' bad ' + bb);
  }
}

// EXT / HOME follow grad log2 G: the normal carries c onto the target equipotential, the tangent drifts along it in
// musical time. HOME unwinds that drift and returns to the exit potential, which is (to the frame's accuracy) the
// point the drop landed on — so the bridge home starts where c already is and nothing jumps.
function stepExt(N, dt, S) {
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
    lgT = clamp(mix(-2.6, -9, clamp(0.55 * S.eS + 0.5 * S.tension, 0, 1)) + 3.2 * S.dropEnv, LG_LO, LG_HI);
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

function stepIn(N, dt, S) {
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

// env: { P: the scene's visual parameters (CONTRACTS §1.16), isLogical: this scene is the director's logical scene }
export function updateNav2(dt, now, S, env) {
  const N = N2;
  if (!N.seeded) resetNav2();
  if (N.flow0 < 0) N.flow0 = S.flow;
  N.pathCut++;
  if (S.dropEvt) doDrop(N, S, now);
  if (N.mode === 'INT') stepInt(N, dt, S, env.P);
  else if (N.mode === 'IN') stepIn(N, dt, S);
  else stepExt(N, dt, S);
  N.c[0] = N.cPath[0];
  N.c[1] = N.cPath[1];
  N.cycBase = N.cyc.has;
  // visual time: crawls as the arms wind up (par), releases on a resolution / a drop (NAV's rule, verbatim)
  if (S.resolveEvt) N.timeScale = Math.max(N.timeScale, 2);
  N.timeScale = ema(N.timeScale, mix(1, 0.05, N.par * N.par), dt, 0.5);
  N.vtime += dt * N.timeScale * (0.15 + 0.85 * S.presence);
  // the PiP's path trail and the critical orbit of f_c (NAV's, verbatim)
  const P = N.path;
  P.copyWithin(3, 0, 95 * 3);
  P[0] = N.c[0];
  P[1] = N.c[1];
  for (let i = 0; i < 96; i++) P[i * 3 + 2] = 1 - i / 96;
  let zr = 0, zi = 0;
  const O = N.orbit, head = (N.vtime * 14) % 160;
  for (let i = 0; i < 160; i++) {
    const t = zr * zr - zi * zi + N.c[0];
    zi = 2 * zr * zi + N.c[1];
    zr = t;
    if (!(zr * zr + zi * zi < 1e6)) {
      zr = 1e3;
      zi = 1e3;
    }
    let d = Math.abs(i - head);
    d = Math.min(d, 160 - d);
    O[i * 3] = zr;
    O[i * 3 + 1] = zi;
    O[i * 3 + 2] = 0.25 + 0.9 * Math.exp(-d * d / 10);
  }
}
