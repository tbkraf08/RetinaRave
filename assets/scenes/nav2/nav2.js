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
import { findCycle, rhoGrad, nearestRational, mkCyc, N_ITER, N_MAX } from '../../math/field.js';
import { V_MAX, FLOW_CAP, cpy, doDrop, stepExt, stepIn } from './exit.js';
import { DET } from './detect.js';
import { RHO_REST, RHO_BEAT, BUMP_K, PULSE_K, RHO_E, NOTE_V, NOTE_MIN, NOTE_ANG, NOTE_LOCK, K_R, V_INT, A_MAX, beatStep } from './beat.js';
export { V_MAX, FLOW_CAP };      // re-exported: the tests and index.js read them from the navigator
export { RHO_REST, RHO_BEAT, BUMP_K, PULSE_K, RHO_E, NOTE_V, NOTE_MIN, NOTE_ANG, NOTE_LOCK, K_R, V_INT, A_MAX };   // the beat's constants (beat.js): the tests and the sweep read them here (import then export: bundle.js's rule)

// --- the melody's wishes (index.js declares `height` / `side` / `lift` from these) -------------------------
export const Y_AMP = 1.3;        // Im c per unit of centroid above/below the middle: UP IS UP (the `height` param's gain)
export const Y_REACH = 0.6;      // ... and the |Im c| a FULL melodic swing asks for, once detect.js has normalised the
                                 // height onto the track's own observed centroid range (DET.hN in [-1, 1])
export const X_HOME = -0.3;      // Re c the balance drifts around: the cardioid's BELLY (boundary |Im| ~0.55, the 1/3
                                 // root straight up). -0.8 was the NECK, |Im| ~0.1, so "melody up" was capped by
                                 // geometry and every drop's rho-normal pointed left at the antenna (v0.8 headed trace)
export const X_AMP = -1.1;       // Re c per unit of (bass - high): NEGATIVE, so bass-heavy drifts LEFT to the cascade
export const LIFT = 0.65;        // view units of blob float per unit of centroid off 0.45 (capped by `lift`'s +-0.3 range)
export const W_Y = 14;           // rad/s — the pitch spring, ~0.3 s settle
export const TAU_X = 1.2;        // musical seconds — the Re bias's ema (~8 real seconds in a #test valley, frozen in silence)
// --- the forces -------------------------------------------------------------------------------------------
export const TAU_M = 0.55;       // s — the melody's pull: v = (wish - c)/TAU_M
export const LOOSE = 0.8;        // how much of the pull a full wind-up takes away
export const BIS = 6;            // bisections to the largest step still inside
export const RHO_CAP = 0.985;    // the wall (float32 uC quantisation; above this the picture stops changing)
// The melody's pull is projected onto the rim's TANGENT unconditionally. Gating the projection on rho (the obvious
// "only once c is near the rim") makes the threshold an unstable equilibrium: below it the melody's inward pull
// fights the spring, above it does not, so c parks exactly there and never crosses — measured, a pin of 0.90 settled
// at 0.7021 against a threshold of 0.72. With the projection always on, rho is the spring's alone and tracks rhoT.
export const RHO_DEGEN = 0.05;   // below this |lambda| the rho-normal is meaningless (at c = 0, lambda = 0 and |lambda|
                                 // is not differentiable), so the OUTWARD direction is taken toward the melody's wish.
                                 // Without it the seed at c = 0 pushed straight along the default normal (1, 0) to the
                                 // CUSP, internal angle 0 — the one place on the rim where the Julia set is a fat round
                                 // blob with no arms at all, and a tangential flow's unstable equilibrium, so it stuck.
export const PAR_LO = 0.8;       // the smoulder's window in rho (NAV's, chart-free)
export const PAR_HI = 0.98;
export const PAR_WIND = 1;       // pass 6: the smoulder (and its time crawl) is gated by the wind-up — par x wind^PAR_WIND —
                                 // so the beat's press to the cap does not light the interior; the pre-drop wind still does
// --- the gates --------------------------------------------------------------------------------------------
export const GATE_Q = 7;         // the largest denominator the Farey address will name
export const GATE_W = 0.02;      // gate width in turns, divided by q
export const GATE_RHO_MIN = 0.72;// at or above this rho c counts as pressed against the wall, and a root it is beside
                                 // is a gate. 0.86 in v0.8 (kept below RHO_FREE 0.91, the rest). With the beat capped
                                 // at RHO_BEAT 0.93 the pulses touch 0.8 only briefly: the second node sweep read 0
                                 // gates at 0.80 / leak 0.3, 1 at 0.80 / leak 0.1, 8 in 60 s at 0.72 / leak 0.3 — the
                                 // last is the user's "as the beat evolves the set should come back to a slightly
                                 // different shape": a gate IS the shape coming back different (period 1 -> 3 -> 1)
export const GATE_HOLD = 1.0;    // beats of held pressure before the cap opens (this is the whole damping on how
                                 // often a gate fires)
export const GATE_LEAK = 0.3;    // v0.13: c no longer rides the rim, the beat presses it there in pulses — so the held
                                 // pressure LEAKS between pulses (this many beats of press per beat unpressed) instead
                                 // of resetting, and a beat landing on a root a few times in a row opens the gate
export const GATE_BUILD = 0.4;   // a wind-up must never change component: no gate while build is above this
export const SIZE_MIN = 0.02;    // the child must be at least this big in c to be worth entering
export const GATE_C = 1;         // child-size proxy: GATE_C*sin(pi p/q)/q^2 / |dlambda/dc| (0.25 at the 1/2 root = its radius)
export const GATE_TOL = 1e-3;    // |lambda - e^{2pi i p/q}| at which we call ourselves AT the root
export const GATE_PUSH = 1.0;    // child sizes to push past the root
export const GATE_WALK = 0.9;    // units of walking toward a root before the gate gives up
export const GATE_CAP = 0.99995; // the cap while a gate is open (the root itself has rho = 1)
const TR = mkCyc(), BE = mkCyc(), GR = { gx: 0, gy: 0, dlr: 0, dli: 0, dl: 0 };
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
  dropBeat: -1e9,        // the beat of NAV2's last cut (exit.js DROP_GAP): a drop inside the gap is a hit, not a cut
  path: new Float32Array(96 * 3), pathCut: 999, orbit: new Float32Array(160 * 3),
  kick: { x: 0 },        // the continuity monitor's shape; NAV2 is chart-free, so this is 0 for ever
  baby: null,            // ... and it never dives into a baby copy
  cycBase: 1, seeded: 0, xSeed: 0, blocked: 0, rhoPin: -1,
  note: -1, noteX: 0, noteY: 0,   // the beat's note (pitch class, latched on the hit) and its point on the rim
  vx: 0, vy: 0,          // the interior velocity (A_MAX slews it)
  log: () => {},
};

const cdiv = (ar, ai, br, bi) => {
  const d = br * br + bi * bi || 1e-300;
  CD[0] = (ar * br + ai * bi) / d;
  CD[1] = (ai * br - ar * bi) / d;
  return CD;
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
  N.dropBeat = -1e9;
  N.vx = N.vy = 0;
  N.pathCut = 999;
  N.gate.on = N.gate.press = N.gate.pushed = N.gate.walk = 0;
  N.cGood[0] = N.cGood[1] = 0;
  N.q = 1;
  N.xSeed = 0;
  // NOT rhoPin: it is a test pin set by a hash hook, which fires BEFORE the first update() and so before this
  // lazy reset runs (CONTRACTS §1.4: "state a hook sets must survive the first update"). Resetting it here ate it.
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
  const pressed = N.rho > GATE_RHO_MIN || N.blocked;
  if (!N.cy.has || S.build >= GATE_BUILD || (N.note >= 0 && DET.pulse > NOTE_LOCK)) {
    G.press = 0;   // no cycle, a wind-up, or a note driving the beat: the species is the note's, not a gate's
    return;
  }
  if (!pressed) {
    G.press = Math.max(0, G.press - GATE_LEAK * db);
    return;
  }
  nearestRational(N.cy.arg / TAU, GATE_Q, FR);
  // Internal angle 0 is the component's OWN root: pressed there, the gate walks back OUT into the parent. That is the
  // same machinery with lambda -> 1, and it is what the tiny-bulb trap steers toward ("the way back out through the root").
  const exit = FR.q === 1;
  const child = exit ? GATE_C * N.compSize : GATE_C * Math.sin(Math.PI * FR.p / FR.q) / (FR.q * FR.q) / Math.max(N.dl, 1e-9);
  if (exit ? (N.q < 2 || FR.err > GATE_W) : (FR.err > GATE_W / FR.q || child < SIZE_MIN)) {
    G.press = Math.max(0, G.press - GATE_LEAK * db);   // pressed, but not beside a root it can use
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
  N.ySp.step(pin ? pin[1] : Y_REACH * D.hN, dt, W_Y);
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
    // The wall owns the RADIUS, the melody owns the ANGLE: the radial part of the melody's pull is projected out and
    // what is left moves c AROUND the component. `side` and `height` therefore choose an angle, not a distance.
    let nx = N.n[0], ny = N.n[1];
    if (N.rho < RHO_DEGEN) {              // no usable normal yet: go out the way the melody is asking
      const ux = wx - N.cPath[0], uy = wy - N.cPath[1], um = Math.sqrt(ux * ux + uy * uy);
      if (um > 1e-9) {
        nx = ux / um;
        ny = uy / um;
      }
    } else {
      const dn = vx * nx + vy * ny;
      vx -= dn * nx;
      vy -= dn * ny;
    }
    // the beat (beat.js): the press, the note, the spring, the cap and the slew
    const bv = beatStep(N, dt, S, nx, ny, vx, vy, RHO_CAP);
    vx = bv[0];
    vy = bv[1];
    moveInt(N, vx * dt, vy * dt);
  }
  N.par = N.cy.has ? sstep(PAR_LO, PAR_HI, N.rho) * (N.q > 1 ? 1 : 0.4) * Math.pow(D.wind, PAR_WIND) : 0;
}

// env: { P: the scene's visual parameters (CONTRACTS §1.16), isLogical: this scene is the director's logical scene }
export function updateNav2(dt, now, S, env) {
  const N = N2;
  if (!N.seeded) resetNav2();
  if (N.flow0 < 0) N.flow0 = S.flow;
  N.pathCut++;
  if (S.dropEvt) doDrop(N, S, now);
  if (N.mode === 'INT') stepInt(N, dt, S, env.P);
  else if (N.mode === 'IN') stepIn(N, dt, S, land);
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
