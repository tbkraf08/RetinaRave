// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// NAV3's navigator — THE BALL ROLLING INSIDE M (DECISIONS §140 step 2, docs/workers/brief-nav3.md). No chart, no table: NAV2's
// BULBS / BABIES / MISI and the (θ, log₂G) ray grid are gone; everything the ball needs is computed from c itself by
// assets/math/field.js (findCycle: the attracting cycle and its multiplier λ; rhoGrad: ∇|λ| and dλ/dc; nearestRational: the
// Farey address of the internal angle). The component's own coordinate is log λ = ln ρ + i·2πθ — holomorphic in c, so one
// complex division (Δc = Δlog λ / (λ'/λ)) is the continuation NAV's bulbChart did by Newton on a table of twelve bulbs, and
// it works in EVERY component of every period (the thousands of smaller bulbs the user asked for).
//   the wall      ρ = |λ| → 1 is the component's boundary (smooth, unlike the exterior distance estimate at a cusp); a step
//                 that would carry ρ past RHO_WALL loses its radial part — the ball SLIDES along the rim
//   pitch is up   the sung pitch's height (math/vox.js y01; the centroid when nobody sings) sets the internal angle θ: TH0 at
//                 the bottom, toward 1/3 (the cardioid's highest point) as the pitch rises; harmAngle / the key turn it
//   loud is out   the track's own loudness ladder (loudlight.js baseLight) sets ρ: quiet near the centre (the Koenigs spiral
//                 loose), loud against the rim (the spiral tightens as arg λ / ln|λ| grows — the curl); the sub press and the
//                 beat breath (move2.js, unchanged) ride on top
//   into a child  pressed against the rim where nearestRational(θ) names p/q (q ≤ QMAX) and the music asks (a build, an
//                 expected drop, rising loudness), the ball crosses the root into the p/q child: the landing is the root +
//                 DIVE·R along the outward normal with R = 1/(|dλ/dc|·q²) (the child's size — exact on the cardioid, where
//                 1/|dλ/dc| = sin πp/q), and findCycle names the new period q·q₀ on its own. Falling loudness rolls it back
//                 out through the same root (θ_child → 0 IS the root to the parent). A stack remembers the way down.
//   the kick      move2.js's lane fires as before; the jump is along the outward normal by KICK3.LEN of the component's size
//                 (the Julia set breaks into dust for a frame — NAV's Misiurewicz jump without the table) and springs back
//   the drop      implode.js: the ball walks to the root (Fatou petals), c crosses to ε outside along the normal (the Lavaurs
//                 explosion, the beat turning the horn-map phase) and comes back when the exterior settles
// A frame whose findCycle does not converge inside N_ITER keeps last frame's c and λ (the step is halved once, then dropped)
// — never a visible jump. Every number is a named constant below; the knobs are hooks on #test (index.js).
import { TAU, clamp, mix, sstep, ema, Spring } from '../../math/util.js';
import { findCycle, rhoGrad, nearestRational, mkCyc, N_ITER, N_MAX } from '../../math/field.js';
import { baseLight } from '../../math/loudlight.js';
import { mkVox, vox } from '../../math/vox.js';
import { tighten, kickGate, M2 } from './move2.js';
import { OUT3, IMP, startDrop, stepDrop, rearm } from './implode.js';   // §140 step 3: the drop as a parabolic implosion (the OUT / EXT / IN modes); §143: rearm
import { ROLL, GATE, SWELL, INT3, KICK3, DANCE, knob5 } from './knobs.js';   // §147: the numbers (split out of this file), re-exported below
export { ROLL, GATE, SWELL, INT3, KICK3, DANCE, knob5 };

const CYC2 = mkCyc(), VX = mkVox();
const KCH = mkCyc(), NOCH = mkCyc();   // §144: the kick's own chart (findCycle at the drawn c while the kick rings) and the empty one (has 0)
const GR = { gx: 0, gy: 0, dlr: 0, dli: 0, dl: 1 };
const C0 = [-0.1725, 0];   // λ = −.3 on the cardioid: ρ .3, θ .5 — a ball that starts resting, not at the singular centre

export const NAV = {
  mode: 'INT', ball: [C0[0], C0[1]], c: [C0[0], C0[1]], cPath: [C0[0], C0[1]], cyc: findCycle(C0[0], C0[1], mkCyc(), N_MAX), grad: GR,   // ball: where the ball IS (findCycle's c); cPath: the path (the ball, or a crossing's lerp); c: the DRAWN c (cPath + the kick) — what index.js uploads
  rhoT: new Spring(0.3, 2.5), thT: new Spring(0.5, 1.4), rho: 0.3, th: 0.5, size: 1, q: 1,
  kp: 0, sn: 0, snSide: 1, kside: 1, pulse: 0,   // the dance's impulses (DANCE): the kick's, the snare's and its side, the kick jump's side, the pulse on ρ
  percE: 0, percS: 1, turn: 0,
  swell: 0, swellOn: 0, swellArm: -99, swells: 0, rise: 0, loudSlow: 0, cLo: NaN, cHi: NaN, percL: 0,   // §145: the swell's ease, its latch, the beat it armed, the count, the rise term, the ladder's slow ema, the centroid's running range   // §144: the eased percussiveness, its scale on the dance, the accumulated bar turn (TURN × bars, × the scale as it goes — not TURN × N.bar, whose product would jump with the scale)
  pend: -1, pends: 0, pendSlams: 0, pendLapsed: 0,   // §147: a kit's shift PENDING the slam — the beat it armed (−1 none), the count, how many a slam fired, how many lapsed into the swell
  shown: null,   // §144: the chart index.js draws — the ball's (cyc), the kick's own while it rings (KCH), or none (NOCH)
  stack: [], cross: null, kick: new Spring(0, 9), kickM: [0, 0], mirror: 1,
  gate: { p: 0, q: 1, err: 1, on: 0 }, loud: 0, loudHist: [], bar: 0, lastBar: 0, lastCross: -99, fell: 0, leaving: 0, since: 0,
  par: 0, timeScale: 1, vtime: 0, pathCut: 999, extBeat: 0, landed: 0, cycBase: 1, stalls: 0, fails: 0, crosses: 0, maxQ: 1, rimT: 0,
  path: new Float32Array(96 * 3), orbit: new Float32Array(160 * 3), tmp: [0, 0], view: [0, 0, 1, 0],
  baby: null,   // the monitor's shape (tools/monitor.js reads {mode, cPath, pathCut, kick:{x}, baby}); no baby copies on this scene
  forceBaby: -1, log: () => {},
};
NAV.rho = NAV.cyc.rho;
NAV.th = NAV.cyc.arg / TAU;
NAV.cyc.lnr = Math.log(NAV.cyc.rho);
NAV.cyc.zs = [NAV.cyc.zr, NAV.cyc.zi];
NAV.shown = NAV.cyc;
NOCH.has = 0; NOCH.zs = [0, 0]; NOCH.lnr = -1; NOCH.arg = 0; NOCH.q = 1; NOCH.eps2 = 0;

const wrap = (x) => x - Math.round(x);
const fifths = (k) => ((7 * (((k | 0) % 12) + 12) % 12) % 12) / 12;

// the shader's view of the cycle: {q, lnr, arg, zs, eps2, has} from field.js's record (index.js uploads uLam / uZs / uEps2)
function publish(cy, cr, ci) {
  cy.lnr = Math.log(Math.max(cy.rho, 1e-6));
  cy.zs = cy.zs || [0, 0];
  cy.zs[0] = cy.zr;
  cy.zs[1] = cy.zi;
  // §140 quality: the shader's convergence radius grows toward the rim. An orbit needs ln(eps/|w₀|)/ln ρ iterations to come within
  // eps of the cycle point — 55 at ρ .95, 190 at .985 against 10 at .75 — and the Koenigs coordinate it reports (Lw/(−ln ρ) + n/q) is
  // an invariant, so stopping the orbit earlier at a bigger eps moves no band. Scaled by CONV_RIM past CONV_R0, capped at CONV_MAX on
  // the cardioid and at .4 × the cycle's own spacing in a child (the next cycle point must stay outside the radius).
  if (cr !== undefined) {
    const k = 1 + ROLL.CONV_RIM * sstep(ROLL.CONV_R0, 1, cy.rho);
    let cap = ROLL.CONV_MAX;
    if (cy.q > 1) {
      let wr = cy.zr, wi = cy.zi, md = 1;
      for (let j = 1; j < cy.q; j++) { const t = wr * wr - wi * wi + cr; wi = 2 * wr * wi + ci; wr = t; md = Math.min(md, Math.hypot(wr - cy.zr, wi - cy.zi)); }
      cap = Math.min(cap, ROLL.CONV_CHILD * md);
    }
    cy.eps2 = Math.min(cy.eps2 * k * k, cap * cap);
  }
  return cy;
}

// the ball's geometry at c: the gradient (the wall's normal), the component's size, ρ, θ
function geometry(N) {
  const cy = N.cyc;
  rhoGrad(N.ball[0], N.ball[1], cy.q, cy.zr, cy.zi, GR);
  N.size = 1 / Math.max(GR.dl, 1e-6);
  N.rho = cy.rho;
  N.th = cy.arg / TAU - Math.floor(cy.arg / TAU);
}

// One step of the roll in the component's own coordinate: Δlog λ → Δc = Δlog λ / (λ'/λ); the wall projects; findCycle accepts.
function roll(N, dt, rhoT, thT, gain, speed = 1) {
  const cy = N.cyc, rho = Math.max(cy.rho, ROLL.RHO_MIN);
  let du = Math.log(clamp(rhoT, ROLL.RHO_MIN * 2, ROLL.RHO_WALL)) - Math.log(rho), dv = wrap(thT - N.th) * TAU;
  const f = Math.min(1, gain * speed * dt), m = Math.hypot(du, dv) * f, cap = ROLL.VMAX * speed * dt;
  const s = m > cap ? cap / m * f : f;
  du *= s;
  dv *= s;
  // ℓ = λ'/λ with |λ| floored (the centre is a pole of the log); Δc = (du + i dv) / ℓ
  const lr = cy.lr * rho / Math.max(cy.rho, 1e-12), li = cy.li * rho / Math.max(cy.rho, 1e-12);
  const d2 = lr * lr + li * li, er = (GR.dlr * lr + GR.dli * li) / d2, ei = (GR.dli * lr - GR.dlr * li) / d2;
  const e2 = er * er + ei * ei;
  if (!(e2 > 1e-30)) return;
  let dx = (du * er + dv * ei) / e2, dy = (dv * er - du * ei) / e2;
  // the wall: the radial part of a step that would pass RHO_WALL is dropped — the ball slides along the rim
  const gm = Math.hypot(GR.gx, GR.gy);
  if (gm > 1e-12) {
    const nx = GR.gx / gm, ny = GR.gy / gm, rad = dx * nx + dy * ny;
    if (cy.rho + rad * gm > ROLL.RHO_WALL && rad > 0) { dx -= rad * nx; dy -= rad * ny; }
  }
  for (let t = 0; t < 2; t++) {
    const k = t ? 0.5 : 1, cx = N.ball[0] + dx * k, cyy = N.ball[1] + dy * k;
    findCycle(cx, cyy, CYC2, N_ITER);
    if (CYC2.has && CYC2.q === cy.q) {
      N.ball[0] = cx;
      N.ball[1] = cyy;
      Object.assign(cy, { zr: CYC2.zr, zi: CYC2.zi, lr: CYC2.lr, li: CYC2.li, rho: CYC2.rho, arg: CYC2.arg, res: CYC2.res, n: CYC2.n, eps2: CYC2.eps2 });
      if (t) N.stalls++;
      return;
    }
  }
  N.fails++;   // neither step converged to this component: c and λ stand (never a visible jump)
}

// The crossing into the p/q child (dir +1) or back to the parent (dir −1): the landing is verified by findCycle before a
// single frame moves. Returns 1 when the crossing starts.
// The root of the component along the outward normal from the ball: c + n̂·(1 − ρ)/|∇ρ| is a one-step linearisation; two
// secant steps along the normal (each a findCycle at N_MAX — a crossing or a drop is a rare event) put it where ρ = 1 to ~1e-3
// of the component's size. Returns { rx, ry, nx, ny } or null when the gradient is degenerate.
const RT = { rx: 0, ry: 0, nx: 0, ny: 0 };
function rootOf(N) {
  const gm = Math.hypot(GR.gx, GR.gy);
  if (gm < 1e-12) return null;
  const nx = GR.gx / gm, ny = GR.gy / gm;
  let rx = N.ball[0], ry = N.ball[1], rho = N.cyc.rho, dsum = 0;
  for (let i = 0; i < GATE.ROOT_STEPS; i++) {
    const d = (1 - rho) / gm * GATE.ROOT_K;
    const c2 = findCycle(rx + nx * d, ry + ny * d, CYC2, N_MAX);
    if (!(c2.has && c2.q === N.cyc.q)) break;   // past the root already: the previous estimate stands
    rx += nx * d; ry += ny * d; dsum += d; rho = c2.rho;
  }
  if (dsum === 0) { const d = (1 - N.cyc.rho) / gm; rx += nx * d; ry += ny * d; }
  RT.rx = rx; RT.ry = ry; RT.nx = nx; RT.ny = ny;
  return RT;
}

function cross(N, S, dir, p, q) {
  const R0 = rootOf(N);
  if (!R0) return 0;
  const { rx, ry, nx, ny } = R0;
  let land = null, cy = null;
  if (dir > 0) {
    const R = N.size / (q * q), Q = N.cyc.q * q;
    if (Q > GATE.P_MAX || N.stack.length >= GATE.DEPTH_MAX) return 0;
    for (const k of GATE.TRIES) {   // the DEEPEST landing that findCycle names q·q₀ (the lowest ρ_child: the child's spiral loose, the shader converging fast)
      const lx = rx + nx * R * GATE.DIVE * k, ly = ry + ny * R * GATE.DIVE * k, c2 = findCycle(lx, ly, mkCyc(), N_MAX);
      if (c2.has && c2.q === Q && (!cy || c2.rho < cy.rho)) { land = [lx, ly]; cy = c2; }
    }
    if (!land) return 0;
    N.stack.push({ c: [N.ball[0], N.ball[1]], q: N.cyc.q, th: N.thT.x, p, qq: q });
  } else {
    const up = N.stack.pop();
    const c2 = findCycle(up.c[0], up.c[1], mkCyc(), N_MAX);
    if (!(c2.has && c2.q === up.q)) { N.stack.push(up); return 0; }
    land = up.c;
    cy = c2;
    N.thT.set(up.th);
  }
  N.cross = { from: [N.ball[0], N.ball[1]], root: [rx, ry], to: land, t: 0, cyc: publish(cy), dir, p, q };
  N.mode = 'CROSS';
  N.crosses++;
  N.lastCross = N.bar;
  N.log('CROSS@' + (S.beatCount | 0) + ' ' + (dir > 0 ? 'into ' + p + '/' + q + ' period ' + cy.q : 'out to period ' + cy.q) + ' c ' + land.map((x) => x.toFixed(6)));
  return 1;
}

// the drop: the parabolic implosion (implode.js) — from the ball through the root along the normal to ε outside, and back
export function navDrop(S, reach, kind = 'slam') {
  const N = NAV, R0 = rootOf(N);
  if (!R0 || N.mode !== 'INT') return 0;
  return startDrop(N, S, [R0.rx, R0.ry], R0.nx, R0.ny, reach, kind);
}

// env: { isLogical, drum, P } as NAV2's (index.js); P.reach is the drop's depth parameter (§1.16)
export function updateNav(dt, now, S, env) {
  const N = NAV, bps = (S.bpm > 40 ? S.bpm : 124) / 60;
  N.bar += dt * bps / 4;
  if (S.sectionEvt && (S.keyConf || 0) > 0) N.mirror = -N.mirror;   // a new section mirrors the rim (θ ↔ 1 − θ: the conjugate picture); §142: only with a key read (Comptine flipped 7 times in 110 s on a piano)
  const park = clamp(Math.max(sstep(0.45, 0.85, S.buildLive), sstep(0.5, 0.8, S.suspension)), 0, 1);
  const T = tighten(dt, S, N);   // move2.js: the beat breath (M2.breath), the sub press (± on ρ), the pitch lean (M2.lean, unused here)
  // the music → the targets. Loudness on the track's own ladder; the pitch as a height (the voice, else the centroid)
  N.loud = baseLight(S.loudRel, S.loudRange, S.loudAbs, isFinite(S.eS) ? S.eS : 0.5);
  if (N.bar - N.lastBar >= 1) { N.lastBar = Math.floor(N.bar); N.loudHist.push(N.loud); if (N.loudHist.length > 8) N.loudHist.shift(); }
  const V = vox(VX, dt, S);
  const c0 = isFinite(S.centroid) ? S.centroid : 0.4;
  if (!isFinite(N.cLo)) { N.cLo = c0 - 0.02; N.cHi = c0 + 0.02; }
  N.cLo = c0 < N.cLo ? c0 : ema(N.cLo, c0, dt, SWELL.CENT_TAU); N.cHi = c0 > N.cHi ? c0 : ema(N.cHi, c0, dt, SWELL.CENT_TAU);   // §145: the running range
  const cent = SWELL.CENT ? clamp((c0 - N.cLo) / Math.max(N.cHi - N.cLo, 0.05), 0, 1) : clamp((c0 - ROLL.CENT_LO) / (ROLL.CENT_HI - ROLL.CENT_LO), 0, 1);
  const height = V.w > 0 && V.y01 >= 0 ? mix(cent, V.y01, V.w) : cent;
  const kc = isFinite(S.keyConf) ? clamp(S.keyConf, 0, 1) : 0;
  let th = ROLL.TH0 + ROLL.TH_SPAN * height + ROLL.HARM * ((S.harmAngle || 0) / Math.PI) + ROLL.KEY * kc * (fifths(S.key) - 0.5);
  if (N.mirror < 0) th = 1 - th;
  // the dance (DANCE): the reactive impulses, the bar turn, the phrase sway
  if (S.kickEvt) N.kp = Math.max(N.kp, isFinite(S.kickAmp) && S.kickAmp > 0 ? S.kickAmp : 0.6);
  N.kp *= Math.exp(-dt / DANCE.KICK_TAU);
  if (S.snareEvt) { N.sn = Math.max(N.sn, S.snareAmp || 0.6); N.snSide = -N.snSide; }
  N.sn *= Math.exp(-dt / DANCE.SNARE_TAU);
  const ph16 = isFinite(S.phrase16Pos) ? S.phrase16Pos : 0;
  // §144: the percussiveness scale on every dance term (a piano's ~.3, a kit's 1); the bar turn accumulates at the scaled rate
  N.percE = ema(N.percE, isFinite(S.perc) ? clamp(S.perc, 0, 1) : 0.5, dt, DANCE.PERC_TAU);
  const ps = DANCE.PERC_REF > 0 ? clamp(N.percE / DANCE.PERC_REF, DANCE.PERC_MIN, 1) : 1;
  N.percS = ps;
  N.turn += ps * DANCE.TURN * dt * bps / 4;
  th += N.turn + ps * (DANCE.SWAY * Math.sin(TAU * ph16 / 16) + DANCE.SNARE * N.sn * N.snSide);
  N.pulse = ps * clamp(DANCE.BASS * (S.bass || 0) + DANCE.KICK * N.kp + DANCE.HIT * (S.hit || 0), 0, 1);
  let rho = S.presence < ROLL.IDLE ? ROLL.IDLE_RHO : mix(ROLL.RHO_LO, ROLL.RHO_HI, N.loud) + (N.mode === 'INT' ? T : 0);   // §142: silence rolls the ball to the circle (c → 0, Q → 1)
  const inChild = N.stack.length > 0, idle = S.presence < ROLL.IDLE;
  // the exit: inside a child, the ladder fallen for EXIT_BARS bars → roll to the child's root (θ 0) and press the rim
  const fell = inChild && N.loud < GATE.FALL;
  N.fell = fell ? N.fell + dt * bps / 4 : 0;
  // the ask: a build, an expected drop, or the ladder risen over BARS bars — the gate's condition, and the rim's steering toward it
  const rise = GATE.RISE > 0 && N.loudHist.length > GATE.BARS && N.loud - N.loudHist[N.loudHist.length - 1 - GATE.BARS] >= GATE.RISE;   // §142: RISE 0 = no ladder-rise ask (it crossed 7 times in 110 s on Comptine)
  // §145 the swell: latched by a shift (or a map line) under PERC_LT, held while shiftHold (BEATS for a map line); the rise term on the ladder's slope
  N.percL = ema(N.percL, isFinite(S.perc) ? clamp(S.perc, 0, 1) : 0.5, dt, SWELL.PERC_TAU);
  const percSL = DANCE.PERC_REF > 0 ? clamp(N.percL / DANCE.PERC_REF, DANCE.PERC_MIN, 1) : 1;
  const lowPerc = SWELL.PERC_LT > 0 && percSL < SWELL.PERC_LT;
  if (lowPerc && (S.shiftEvt || (SWELL.MAP && S.mapDropEvt))) { N.swellOn = 1; N.swellArm = S.beatCount; N.swells++; }
  // §147: on a kit a shift ARMS instead of imploding — the swell's own press while the slam is awaited (SHIFT_WAIT bars); the slam fires
  // the implosion below (slamIn) and clears it; the window lapsing leaves the swell to shiftHold
  if (!lowPerc && S.shiftEvt && SWELL.SHIFT_WAIT > 0) { N.pend = S.beatCount; N.pends++; N.swellOn = 1; N.swellArm = S.beatCount; N.swells++; }
  if (N.pend >= 0 && S.beatCount - N.pend >= 4 * SWELL.SHIFT_WAIT) { N.pend = -1; N.pendLapsed++; }
  const pending = N.pend >= 0;
  const swelling = N.swellOn && ((S.shiftHold || 0) > 0 || S.beatCount - N.swellArm < SWELL.BEATS || pending);
  if (!swelling) N.swellOn = 0;
  N.swell = ema(N.swell, swelling ? 1 : 0, dt, SWELL.TAU);
  N.loudSlow = ema(N.loudSlow, N.loud, dt, SWELL.RISE_TAU);
  N.rise = clamp((N.loud - N.loudSlow) * SWELL.RISE_GAIN, 0, 1);
  const asks = S.buildLive >= GATE.BUILD || S.dropExpectedIn > 0 || rise || N.swell > 0.5;
  if (inChild && N.fell >= GATE.EXIT_BARS) N.leaving = 1;   // latched: the way out is taken once decided, unless the music comes back loud
  if (inChild && !asks && N.bar - N.lastCross >= GATE.CHILD_BARS) N.leaving = 2;   // the depth pass: a child crossing holds CHILD_BARS bars once the music stops asking, then the ball rolls back out — the cardioid and its first-level bulbs are home
  if (!inChild || (N.leaving === 1 && N.loud > GATE.FALL + GATE.HYST)) N.leaving = 0;
  const leaving = N.leaving > 0;
  if (leaving) { th = 0; rho = Math.max(rho, GATE.RHO + 0.02); }
  else if ((asks || N.rise > SWELL.RISE_STEER) && N.mode === 'INT' && N.stack.length < GATE.DEPTH_MAX && N.rho >= GATE.RHO - GATE.NEAR && N.bar - N.lastCross >= GATE.HOLD) {   // §145: the rise steers too
    const r = nearestRational(N.th, GATE.QMAX);   // the rim slides toward the nearest gateway whose child is inside the period cap
    if (r.q >= 2 && N.cyc.q * r.q <= GATE.P_MAX) th = r.p / r.q;
  }
  if (park > 0.5 || asks) rho = Math.max(rho, GATE.RHO + 0.02);
  else if (N.rise > 0 && N.mode === 'INT') rho = mix(rho, Math.max(rho, GATE.RHO + 0.02), N.rise);   // §145: the ladder's rise presses toward the rim before the shift lands   // a build (or any ask) presses the ball against the rim: the gateway (NAV's park at the root)
  N.rhoT.step(clamp(rho, ROLL.RHO_MIN * 4, ROLL.RHO_WALL), dt, ROLL.W_RHO);
  N.thT.step(th + Math.round(N.thT.x - th), dt, ROLL.W_TH);

  if (N.mode === 'INT') {
    {   // §142: idle rolls too (to the circle, ROLL.IDLE_RHO); before, idle froze the ball where it was
      const rhoEff = clamp(N.rhoT.x + (ROLL.BREATH * M2.breath + N.pulse) * Math.max(0, ROLL.PULSE_TOP - N.rhoT.x), ROLL.RHO_MIN * 4, ROLL.RHO_WALL);   // the press reaches PULSE_TOP, never the wall   // the beat breath (move2) + the reactive pulse (DANCE) press toward the rim
      roll(N, dt, rhoEff, N.thT.x, ROLL.GAIN * (ROLL.G0 + (1 - ROLL.G0) * clamp(S.intensity || 0, 0, 1)), leaving ? GATE.EXIT_SPEED : 1);
      geometry(N);
    }
    // the gate: against the rim, at a p/q root the Farey address names, and the music asks
    if (N.rho >= GATE.RHO) N.rimT += dt;   // time on the rim (the per-track table's number): pressed against the wall at or past GATE.RHO
    const g = N.gate, r = nearestRational(N.th, GATE.QMAX);
    g.p = r.p; g.q = r.q; g.err = r.err;
    const atRim = N.rho >= GATE.RHO, named = r.q >= 2 && r.err < GATE.TOL / (r.q * r.q);
    g.on = atRim && named && asks && N.stack.length < GATE.DEPTH_MAX && N.bar - N.lastCross >= GATE.HOLD ? 1 : 0;
    if (g.on && !idle && cross(N, S, 1, r.p, r.q)) N.maxQ = Math.max(N.maxQ, N.cross.cyc.q);
    else if (leaving && atRim && Math.min(N.th, 1 - N.th) < GATE.OUT_TOL && cross(N, S, -1, 0, 1)) N.fell = 0;
    publish(N.cyc, N.ball[0], N.ball[1]);   // + the rim-scaled convergence radius
    N.cyc.has = 1;
    N.par = sstep(0.8, 0.98, N.rho) * (N.cyc.q > 1 ? 1 : 0.4);
    N.cPath[0] = N.ball[0];
    N.cPath[1] = N.ball[1];
  } else if (N.mode === 'CROSS') {   // through the root: in by the root's half, out the other — the last chart held, par peaking at the root
    const X = N.cross;
    X.t = Math.min(1, X.t + dt / GATE.T);
    const t = X.t, u = t < 0.5 ? sstep(0, 0.5, t) : sstep(0.5, 1, t), a = t < 0.5 ? X.from : X.root, b = t < 0.5 ? X.root : X.to;
    N.cPath[0] = mix(a[0], b[0], u);
    N.cPath[1] = mix(a[1], b[1], u);
    N.par = 1 - Math.abs(2 * t - 1);
    if (t >= 1) {
      N.ball[0] = X.to[0];
      N.ball[1] = X.to[1];
      N.cyc = X.cyc;
      N.cyc.has = 1;
      geometry(N);
      N.thT.set(X.dir > 0 ? N.th : N.thT.x);
      N.rhoT.set(N.rho);
      N.q = N.cyc.q;
      N.mode = 'INT';
      N.cross = null;
      N.landed = S.beatCount;
    }
  } else {   // OUT / EXT / IN: the parabolic implosion (implode.js) — the way in to the root, the exploded set, the way back
    const was = N.mode;
    stepDrop(N, S, dt, idle);
    if (was !== 'INT' && N.mode === 'INT') geometry(N);   // landed back on the ball: the gradient and the size are the ball's again
  }
  // the drop: the live detector's slam, and (OUT3.ANY, the default) the map's / the fake timeline's dropEvt too — the fake timeline
  // never arms the live detector, so #test would never show the exit; a refractory of DROP_REFR beats keeps the two from double-firing
  // §145: under PERC_LT a shift (and a map line, with SWELL.MAP) swells instead (above); the implosion is the confirmed slam's — and the shift's on a kit
  // §147: with SHIFT_WAIT a kit's shift never implodes on its own (it armed above); the slam does, and closes the pending
  const slamIn = S.dropLiveEvt || (S.mapDropEvt && !(lowPerc && SWELL.MAP)) || (OUT3.ANY && S.dropEvt), shiftIn = S.shiftEvt && !lowPerc && !(SWELL.SHIFT_WAIT > 0);
  if (slamIn && pending) { N.pend = -1; N.pendSlams++; N.swellOn = 0; }
  const kind = slamIn ? 'slam' : 'shift';
  const drop = (slamIn || shiftIn) && S.beatCount - N.extBeat >= OUT3.DROP_REFR;   // §107's rule: the live slam OR the file map's frame-exact line; §143: OR the engine's energy shift (shiftEvt — the drop a piano has); v3's dropEvt only with OUT3.ANY (&n3drop=any)
  if (drop && N.mode === 'CROSS') {   // a drop mid-crossing: land first (the chart is already verified), then leave
    const X = N.cross;
    N.ball[0] = X.to[0]; N.ball[1] = X.to[1]; N.cyc = X.cyc; N.cyc.has = 1;
    geometry(N);
    N.thT.set(N.th); N.rhoT.set(N.rho); N.q = N.cyc.q; N.mode = 'INT'; N.cross = null;
  }
  if (drop && N.mode === 'INT') navDrop(S, env.P && isFinite(env.P.reach) ? env.P.reach : -6, kind);
  else if (drop && (N.mode === 'OUT' || N.mode === 'EXT' || N.mode === 'IN')) rearm(N, S, kind);   // §143: a drop mid-implosion re-arms it instead of being discarded (Comptine's 52.17 was lost that way)
  // the kick (move2.js's lane): along the outward normal by LEN × the component's size, hiding the chart while it rings
  const kk = kickGate(S, N, park, env);
  if (kk > 0) {
    const gm = Math.hypot(GR.gx, GR.gy) || 1;
    N.kside = -N.kside;   // the side alternates per kick: the normal turned by ±ANG — the jump swings the lobes, not only the rim
    const ca = Math.cos(KICK3.ANG), sa = Math.sin(KICK3.ANG) * N.kside, nx = GR.gx / gm, ny = GR.gy / gm;
    const len = KICK3.LEN * (1 - N.rho) * N.size * (KICK3.PERC ? N.percS : 1);   // §144: × the percussiveness scale (a piano's kicks are the left hand)
    N.kickM[0] = N.cPath[0] + (nx * ca - ny * sa) * len;   // §142: the jump is LEN of the way to the wall ((1 − ρ)·size ≈ the distance to the rim), never past it — a ball at the rim once landed outside M (6 of Comptine's 8 kicks) and the set went to dust
    N.kickM[1] = N.cPath[1] + (nx * sa + ny * ca) * len;
    N.kick.set(kk);
    if (M2.lastK === kk && S.kickAge > 0 && S.kickAge < 0.03) N.kick.step(0, S.kickAge);
  }
  N.kick.step(0, dt);
  const k = N.kick.x;
  N.c[0] = mix(N.cPath[0], N.kickM[0], k);   // the DRAWN c: the kick displaces the picture, never the ball
  N.c[1] = mix(N.cPath[1], N.kickM[1], k);
  N.cycBase = N.cyc.has;
  // §144: the chart through the kick — while the kick rings the DRAWN c is off the ball, so its chart is found on its own (findCycle at
  // N.c, the same period: the Koenigs bands tighten toward the rim with the jump); the ball's chart (N.cyc) is untouched. A drawn c
  // findCycle cannot name (outside, or another period) draws none — v0.43's blink, and the rest when KICK3.CHART is 0
  N.shown = N.cyc;
  if (k > 0.02) {
    N.shown = NOCH;
    if (KICK3.CHART && N.cyc.has && findCycle(N.c[0], N.c[1], KCH, N_ITER).has && KCH.q === N.cyc.q) { publish(KCH, N.c[0], N.c[1]); KCH.has = 1; N.shown = KCH; }
  }
  N.q = N.cyc.q;
  // visual time: crawls near the wall (critical slowing), releases on resolution / drop
  if (S.resolveEvt) N.timeScale = Math.max(N.timeScale, 2);
  N.timeScale = ema(N.timeScale, mix(1, 0.05, N.par * N.par), dt, 0.5);
  N.vtime += dt * N.timeScale * (ROLL.T_FLOOR + (1 - ROLL.T_FLOOR) * S.presence) * (1 - (1 - OUT3.IMP_TIME) * IMP.y);   // §145: the palette / spoke clock frozen (IMP_TIME 0) while the implosion is up   // §142: NAV3's own clock (loop.js takes rt.time as the palette / spoke time) — at presence 0 nothing moves
  // path trail (PiP) + critical orbit, as NAV's — on the drawn c
  N.pathCut++;
  const P = N.path, dc = N.c;
  P.copyWithin(3, 0, 95 * 3);
  P[0] = dc[0];
  P[1] = dc[1];
  for (let i = 0; i < 96; i++) P[i * 3 + 2] = 1 - i / 96;
  let zr = 0, zi = 0;
  const O = N.orbit, head = (N.vtime * 14) % 160;
  for (let i = 0; i < 160; i++) {
    const t = zr * zr - zi * zi + dc[0];
    zi = 2 * zr * zi + dc[1];
    zr = t;
    if (!(zr * zr + zi * zi < 1e6)) { zr = 1e3; zi = 1e3; }
    let d = Math.abs(i - head);
    d = Math.min(d, 160 - d);
    O[i * 3] = zr;
    O[i * 3 + 1] = zi;
    O[i * 3 + 2] = 0.25 + 0.9 * Math.exp(-d * d / 10);
  }
}

export { GR, VX };
