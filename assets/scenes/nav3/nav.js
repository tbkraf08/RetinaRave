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
import { OUT3, startDrop, stepDrop } from './implode.js';   // §140 step 3: the drop as a parabolic implosion (the OUT / EXT / IN modes)

export const ROLL = {
  RHO_LO: 0.45,    // the ρ target when the track is at its quietest (the §140 retune: was .25, then .55 — the pulse needs room below the rim to swing — the user: "the set doesn't seem to be dancing"; the ball lives near the rim, where ρ → 1 pinches the Julia set)
  RHO_HI: 0.9,     // ... at its loudest (the depth pass: was .955 — with the pulse on top the ball sat pinned at the wall 35–39 % of its frames on IBelongHere / SeeYouDrop / Vienna, every step projected to zero: the loud ceiling leaves the pulse .06 of headroom under PULSE_TOP now)
  RHO_WALL: 0.985, // the wall: a step past it is projected along the rim (field.js converges inside 1000 steps to .985; was .97)
  RHO_MIN: 0.02,   // below this |λ| the log coordinate is singular (the centre); the floor the division uses
  TH0: 0.5,        // the internal angle (turns) at pitch 0: the point opposite the root (on the cardioid, c = −.75)
  TH_SPAN: -0.17,  // turns per unit pitch height: up = toward 1/3, the cardioid's highest point (Im c .65)
  HARM: 0.05,      // turns of θ per π of harmAngle: the harmony's place on the fifths circle leans the rim position
  KEY: 0.08,       // turns of θ across the key's circle of fifths, weighted by keyConf: one key, one sector of the rim
  CENT_LO: 0.25,   // the centroid range read as pitch height when nobody sings (centroid is 0..1, log2-weighted)
  CENT_HI: 0.65,
  W_RHO: 9,        // 1/s: the ρ target's spring (the retune: was 3.5 — a beat, not a bar)
  W_TH: 5,         // 1/s: the θ target's spring (was 1.4)
  GAIN: 12,        // per s: the fraction of the log λ error closed; ×(G0 + (1 − G0)·intensity) — the bar's energy is the step (was 4)
  G0: 0.35,
  VMAX: 3.5,       // per s: the ball's top speed in |Δlog λ| (was 1.2; 4 put the per-frame c step at .059 on the node drive, over the monitor's .06 with no margin)
  BREATH: 0.5,     // the beat breath's press toward the rim: ρ += BREATH·M2.breath·(PULSE_TOP − ρ)
  PULSE_TOP: 0.965, // the depth pass: the ceiling the breath and the dance's pulse press toward (was the wall itself: pinned there the step is projected to zero and the picture stands still)
  CONV_RIM: 0.6,   // §140 quality → the depth pass: the shader's convergence radius ×(1 + CONV_RIM·sstep(CONV_R0, 1, ρ)) — at 2 past .85 with a .12 cap the orbit stopped so early that the interior rendered as a flat disc (the user: "lots of little circles"); the Koenigs bands need the orbit to spiral in
  CONV_R0: 0.93,
  CONV_MAX: 0.05,  // the radius's cap on the cardioid (z units; was .12)
  CONV_CHILD: 0.15, // §142 the circles: in a child the cap is CONV_CHILD × the cycle's spacing (was .4: a period-4 child showed four flat dark discs)
  IDLE: 0.15,      // presence below this: the ball rolls to the circle and the clock stops (NAV froze it where it was)
  IDLE_RHO: 0.08,  // §142 silence: the ρ target while idle — RHO_MIN·4, c ≈ λ/2 ≈ 0, the Julia set a circle (Q → 1 by green.js)
  T_FLOOR: 0,      // §142: the visual clock's rate at presence 0 (was .15: the exterior bands and spokes drifted through silence)
  DOTS_RHO: 0.85,  // §142 the circles: the critical-orbit sprites draw only with a chart on and ρ under this (they piled into bright blobs at the rim and in a crossing)
};
export const GATE = {
  QMAX: 7,         // the deepest child the rim names (nearestRational's q cap)
  TOL: 0.5,        // |θ − p/q| < TOL / q² names the child (a p/q bulb's footprint on the rim shrinks like 1/q²)
  RHO: 0.9,        // pressed against the rim: ρ at or above this may cross
  NEAR: 0.15,      // while the music asks and ρ is within NEAR of GATE.RHO, θ's target snaps to the nearest p/q: the rim slides TOWARD the gateway
  BUILD: 0.7,      // buildLive at or above this asks to go in (§142: was .45 — the live detector arms a bar early on a swell, Comptine 1:45)
  RISE: 0,         // a rise of the loudness ladder by this over BARS bars asks to go in; 0 = off (§142: crossings only on buildLive / dropExpectedIn; was .1)
  BARS: 2,
  FALL: 0.3,       // ladder under this for EXIT_BARS bars (inside a child) rolls the ball back out
  EXIT_BARS: 1.5,  // bars of a fallen ladder before the ball rolls back out (a one-bar drop-out is a fill, not a breakdown)
  HYST: 0.3,       // the way out, once decided, is abandoned only when the ladder climbs back above FALL + HYST
  EXIT_SPEED: 2,   // the roll to the exit root is this much faster than VMAX (the way out is a decision, not a drift)
  P_MAX: 7,        // the period cap (the depth pass: was 14 — a period ≥ 8 filled Julia set is a rosette of small components, not the one blob with spiral arms the user knows; with DEPTH_MAX 1 only the cardioid's own p/q children, q ≤ QMAX)
  DIVE: 0.6,       // the landing: DIVE·R past the root along the normal (R the child's size; the child's centre is at R)
  TRIES: [1, 1.5, 2, 0.6, 2.6],   // DIVE multipliers tried; the deepest landing findCycle names q·q₀ wins
  ROOT_STEPS: 2,   // secant steps along the normal onto ρ = 1 before the landing is measured from the root
  ROOT_K: 0.9,     // each secant step takes this fraction of the linear estimate (ρ is concave toward the rim: the full step overshoots)
  T: 0.8,          // s: the crossing — c eases root-ward then into the child with the last chart held, par peaking at the root
  HOLD: 2,         // bars inside a component before the next crossing
  OUT_TOL: 0.02,   // turns: |θ_child| under this at the rim = at the root back to the parent
  DEPTH_MAX: 1,    // the depth pass: how many children deep the ball may go (1 = the cardioid and its first-level bulbs are home)
  CHILD_BARS: 2,   // bars a child crossing holds at most while the music no longer asks — then the ball rolls back out (the fallen ladder still exits earlier)
};
export const KICK3 = { LEN: 0.5, ANG: 0.9 };   // the kick's jump: LEN × the component's size (1/|dλ/dc|) along the outward normal turned by ±ANG rad (the side alternating per kick — the lobes swing, not only the rim), × the lane's k
// THE DANCE (the §140 retune; the user on key 7: "the fractal shape doesn't seem to be changing that much … the set doesn't seem to
// be dancing with the music"): the set dances when log λ swings, so the REACTIVE levels drive ρ and θ directly — never a predicted
// route (the user's rule: reactive levels look in sync, predicted ones don't). Measured before the retune on the nine tracks:
// NAV3 |Δlog λ| .008–.14 per beat against NAV2's .29–1.14 (tools/work/nav3/dance-before.txt).
export const DANCE = {
  BASS: 0.6,       // ρ += BASS·bass·(1 − ρ): the bass level presses the ball out, the spiral's tightness (arg λ / ln|λ|) pulsing with every kick
  KICK: 0.8,       // ρ += KICK·kp·(1 − ρ): the kick lane's impulse (kickAmp on kickEvt, decaying over KICK_TAU)
  KICK_TAU: 0.2,   // s
  HIT: 0.3,        // ρ += HIT·hit·(1 − ρ): the ears' hit impulse
  TURN: 0.1,       // turns of θ per BAR, steady: the lobes rotate across a bar (a full turn in 10 bars; the first pass at .06 read .6–1 rad of arg swing per bar against NAV2's 1–1.8)
  SWAY: 0.18,      // turns of θ swaying over the 16-beat phrase: the overall shape is never the same two bars running
  SNARE: 0.08,     // turns of θ kicked by the snare (snareAmp on snareEvt, decaying over SNARE_TAU), the side alternating: the 2-and-4 twitch
  SNARE_TAU: 0.25, // s
};

const CYC2 = mkCyc(), VX = mkVox();
const GR = { gx: 0, gy: 0, dlr: 0, dli: 0, dl: 1 };
const C0 = [-0.1725, 0];   // λ = −.3 on the cardioid: ρ .3, θ .5 — a ball that starts resting, not at the singular centre

export const NAV = {
  mode: 'INT', ball: [C0[0], C0[1]], c: [C0[0], C0[1]], cPath: [C0[0], C0[1]], cyc: findCycle(C0[0], C0[1], mkCyc(), N_MAX), grad: GR,   // ball: where the ball IS (findCycle's c); cPath: the path (the ball, or a crossing's lerp); c: the DRAWN c (cPath + the kick) — what index.js uploads
  rhoT: new Spring(0.3, 2.5), thT: new Spring(0.5, 1.4), rho: 0.3, th: 0.5, size: 1, q: 1,
  kp: 0, sn: 0, snSide: 1, kside: 1, pulse: 0,   // the dance's impulses (DANCE): the kick's, the snare's and its side, the kick jump's side, the pulse on ρ
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
export function navDrop(S, reach) {
  const N = NAV, R0 = rootOf(N);
  if (!R0 || N.mode !== 'INT') return 0;
  return startDrop(N, S, [R0.rx, R0.ry], R0.nx, R0.ny, reach);
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
  const cent = clamp(((isFinite(S.centroid) ? S.centroid : 0.4) - ROLL.CENT_LO) / (ROLL.CENT_HI - ROLL.CENT_LO), 0, 1);
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
  th += DANCE.TURN * N.bar + DANCE.SWAY * Math.sin(TAU * ph16 / 16) + DANCE.SNARE * N.sn * N.snSide;
  N.pulse = clamp(DANCE.BASS * (S.bass || 0) + DANCE.KICK * N.kp + DANCE.HIT * (S.hit || 0), 0, 1);
  let rho = S.presence < ROLL.IDLE ? ROLL.IDLE_RHO : mix(ROLL.RHO_LO, ROLL.RHO_HI, N.loud) + (N.mode === 'INT' ? T : 0);   // §142: silence rolls the ball to the circle (c → 0, Q → 1)
  const inChild = N.stack.length > 0, idle = S.presence < ROLL.IDLE;
  // the exit: inside a child, the ladder fallen for EXIT_BARS bars → roll to the child's root (θ 0) and press the rim
  const fell = inChild && N.loud < GATE.FALL;
  N.fell = fell ? N.fell + dt * bps / 4 : 0;
  // the ask: a build, an expected drop, or the ladder risen over BARS bars — the gate's condition, and the rim's steering toward it
  const rise = GATE.RISE > 0 && N.loudHist.length > GATE.BARS && N.loud - N.loudHist[N.loudHist.length - 1 - GATE.BARS] >= GATE.RISE;   // §142: RISE 0 = no ladder-rise ask (it crossed 7 times in 110 s on Comptine)
  const asks = S.buildLive >= GATE.BUILD || S.dropExpectedIn > 0 || rise;
  if (inChild && N.fell >= GATE.EXIT_BARS) N.leaving = 1;   // latched: the way out is taken once decided, unless the music comes back loud
  if (inChild && !asks && N.bar - N.lastCross >= GATE.CHILD_BARS) N.leaving = 2;   // the depth pass: a child crossing holds CHILD_BARS bars once the music stops asking, then the ball rolls back out — the cardioid and its first-level bulbs are home
  if (!inChild || (N.leaving === 1 && N.loud > GATE.FALL + GATE.HYST)) N.leaving = 0;
  const leaving = N.leaving > 0;
  if (leaving) { th = 0; rho = Math.max(rho, GATE.RHO + 0.02); }
  else if (asks && N.mode === 'INT' && N.stack.length < GATE.DEPTH_MAX && N.rho >= GATE.RHO - GATE.NEAR && N.bar - N.lastCross >= GATE.HOLD) {
    const r = nearestRational(N.th, GATE.QMAX);   // the rim slides toward the nearest gateway whose child is inside the period cap
    if (r.q >= 2 && N.cyc.q * r.q <= GATE.P_MAX) th = r.p / r.q;
  }
  if (park > 0.5 || asks) rho = Math.max(rho, GATE.RHO + 0.02);   // a build (or any ask) presses the ball against the rim: the gateway (NAV's park at the root)
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
  const drop = (S.dropLiveEvt || S.mapDropEvt || (OUT3.ANY && S.dropEvt)) && S.beatCount - N.extBeat >= OUT3.DROP_REFR;   // §107's rule: the live slam OR the file map's frame-exact line (mapDropEvt — without it six of nine tracks never left in the gate's windows); dropEvt is the fake timeline's
  if (drop && N.mode === 'CROSS') {   // a drop mid-crossing: land first (the chart is already verified), then leave
    const X = N.cross;
    N.ball[0] = X.to[0]; N.ball[1] = X.to[1]; N.cyc = X.cyc; N.cyc.has = 1;
    geometry(N);
    N.thT.set(N.th); N.rhoT.set(N.rho); N.q = N.cyc.q; N.mode = 'INT'; N.cross = null;
  }
  if (drop && N.mode === 'INT') navDrop(S, env.P && isFinite(env.P.reach) ? env.P.reach : -6);
  // the kick (move2.js's lane): along the outward normal by LEN × the component's size, hiding the chart while it rings
  const kk = kickGate(S, N, park, env);
  if (kk > 0) {
    const gm = Math.hypot(GR.gx, GR.gy) || 1;
    N.kside = -N.kside;   // the side alternates per kick: the normal turned by ±ANG — the jump swings the lobes, not only the rim
    const ca = Math.cos(KICK3.ANG), sa = Math.sin(KICK3.ANG) * N.kside, nx = GR.gx / gm, ny = GR.gy / gm;
    N.kickM[0] = N.cPath[0] + (nx * ca - ny * sa) * KICK3.LEN * (1 - N.rho) * N.size;   // §142: the jump is LEN of the way to the wall ((1 − ρ)·size ≈ the distance to the rim), never past it — a ball at the rim once landed outside M (6 of Comptine's 8 kicks) and the set went to dust
    N.kickM[1] = N.cPath[1] + (nx * sa + ny * ca) * KICK3.LEN * (1 - N.rho) * N.size;
    N.kick.set(kk);
    if (M2.lastK === kk && S.kickAge > 0 && S.kickAge < 0.03) N.kick.step(0, S.kickAge);
  }
  N.kick.step(0, dt);
  const k = N.kick.x;
  N.c[0] = mix(N.cPath[0], N.kickM[0], k);   // the DRAWN c: the kick displaces the picture, never the ball
  N.c[1] = mix(N.cPath[1], N.kickM[1], k);
  N.cycBase = N.cyc.has;
  if (k > 0.02) N.cyc.has = 0;
  N.q = N.cyc.q;
  // visual time: crawls near the wall (critical slowing), releases on resolution / drop
  if (S.resolveEvt) N.timeScale = Math.max(N.timeScale, 2);
  N.timeScale = ema(N.timeScale, mix(1, 0.05, N.par * N.par), dt, 0.5);
  N.vtime += dt * N.timeScale * (ROLL.T_FLOOR + (1 - ROLL.T_FLOOR) * S.presence);   // §142: NAV3's own clock (loop.js takes rt.time as the palette / spoke time) — at presence 0 nothing moves
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

// the knobs as hooks: n3roll=RHO_LO,RHO_HI[,TH0,TH_SPAN[,GAIN,VMAX]] · n3gate=QMAX,TOL[,BUILD,RISE[,FALL,EXIT_BARS[,DIVE]]] · n3kick3=LEN
export function knob5(name, v) {
  const s = String(v === undefined || v === null ? '' : v), T = name === 'roll' || name === 'conv' ? ROLL : name === 'gate' ? GATE : name === 'dance' ? DANCE : KICK3;
  if (s === '' || s === '1') return Object.assign({}, T);   // a bare call READS (CARD.hooks.n3roll() from the console; the knob alone in the URL)
  const nums = s.split(',').map(Number);
  if (!nums.length || nums.some((x) => !isFinite(x))) return null;
  const set = (T, keys) => keys.forEach((k, i) => { if (i < nums.length) T[k] = nums[i]; });
  if (name === 'roll') set(ROLL, ['RHO_LO', 'RHO_HI', 'TH0', 'TH_SPAN', 'GAIN', 'VMAX']);
  if (name === 'gate') set(GATE, ['QMAX', 'TOL', 'BUILD', 'RISE', 'FALL', 'EXIT_BARS', 'DIVE', 'P_MAX', 'DEPTH_MAX', 'CHILD_BARS']);   // the depth pass's A/B: &n3gate=7,0.5,0,0.1,0.3,1.5,0.6,14,2,99 is the quality pass's depth
  if (name === 'kick3') set(KICK3, ['LEN', 'ANG']);
  if (name === 'dance') set(DANCE, ['BASS', 'KICK', 'HIT', 'TURN', 'SWAY', 'SNARE']);
  if (name === 'conv') set(ROLL, ['CONV_RIM', 'CONV_R0', 'CONV_MAX', 'CONV_CHILD', 'DOTS_RHO']);   // the depth pass's A/B: &n3conv=2,0.85,0.12 is the quality pass's flat disc; &n3conv=.6,.93,.05,.4 the v0.43 child disc (§142)
  return nums;
}
export { GR, VX };
