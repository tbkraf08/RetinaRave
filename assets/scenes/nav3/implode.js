// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// NAV3's drop — THE PARABOLIC IMPLOSION (DECISIONS §140 step 3, docs/workers/brief-nav3.md). NAV parked at the root and jumped to
// the exterior; here the drop is a CROSSING of the parabolic point. Three stages, one per mode:
//   OUT  the way in: over T_IN s the ball walks from inside the component to its root c₀ (λ → e^{2πi p/q}, the p/q the rim's
//        Farey address names). The attracting cycle's point z₀ becomes a parabolic point of g = f^{Q} with q petals, and the
//        shader colours the interior by PETAL INDEX and the phase of the Fatou coordinate Φ(z) ≈ −1/(q·a·(z − z₀)^q) — the
//        time-to-leave the petal — so the q petals pinwheel with the bars (uImp.x rises 0 → 1).
//   EXT  the way out: c = c₀ + d̂·ε, ε small, d̂ a direction that LEAVES M — not the rim's normal: at a satellite root the parent's
//        outward normal points INTO the child (the child hangs there; c₀ + n̂ε is its slow attracting cycle, the parabolic
//        bifurcation), and the exterior is the thin wedge between the two tangent components, α ∈ (π/2 − ε/2R_child, π/2 +
//        ε/2R_parent) from the normal — FAN probes a fan dense around ±π/2 with field.js's escapes() (no table) and takes the
//        first direction outside at ε₀ and 4ε₀. The Julia set has imploded (Lavaurs): the orbits that converged now pass
//        through the near-parabolic GATE around z₀ — but the approach to a q-petal point is algebraic (~1/(q a r^q) steps of
//        f^Q from radius r), so inside the shader's budget the gate passages exist only for the outer petal zones at low q;
//        what the budget SEES is the former interior's ESCAPE — the dust eating inward as ε grows, re-filling as it shrinks —
//        with the passage count and the time near z₀ as layers on top. The beat turns the horn-map phase: ε breathes by
//        EPS_BEAT within each beat (and EPS_DROP with the drop's envelope), so the transit σ = frac(π/√ε) (the q = 1 normal
//        form's) sweeps its cycle and the exploded set breathes with the bar line (uImp.y rises; uSig = σ).
//   IN   the return: when the exterior settles (OUT3.SETTLE beats; PEAK at a peak) c eases back to the ball over T_BACK s
//        with the chart restored at the end.
// The root c₀ and its parabolic point z₀ are solved, not tabulated: mandel.js's solveMult (a Newton in (z, c) onto the target
// multiplier) continued from the ball's λ. The petal coefficient a is measured: a = mean over four directions of
// (g(z₀ + w) − z₀ − w) / w^{q+1} at |w| = W0 — g = f^{Q·q} iterated on the CPU once per drop — at the ROOT (at the rim's cycle
// point the linear term swamps it). The petal radius Rp = PET_R·(PET_K/|a|)^{1/q}, the gate R = GATE_FRAC·Rp; layer() is the
// CPU ruler of the explosion (the escape fraction of the former petal's zones inside the budget, their mean passage count).
// Maths after Douady–Hubbard (the parabolic root points of M), Lavaurs (1989, the implosion and its phase), Shishikura (the
// Fatou coordinates and the horn map; LMS 274, 2000) and Inou–Mukherjee (2016, the horn map's translation constant σ); the
// user's notes on both (MandelBound theory/t-parab-horn-map-p24-p50.md, QuantumComputing's cardioid-cusp toolkit) are the brief.
// Pure state + numbers: no GL. index.js uploads IMP; nav.js calls startDrop() / stepDrop().
import { clamp, mix, sstep, TAU } from '../../math/util.js';
import { findCycle, mkCyc, N_MAX, nearestRational, escapes } from '../../math/field.js';
import { solveMult } from '../../math/mandel.js';   // Newton in (z, c) onto a target multiplier — a solver, not a table (BULBS and the ray grid stay unused)

export const OUT3 = {
  T_IN: 1.4,       // s: the way in — from the ball to the root, the petals lighting
  PET_FROM: 0.6,   // the petal layer fades in from this fraction of the way in (0 at PET_FROM, 1 at the root)
  CHART_TO: 0.85,  // the Koenigs chart holds until this fraction of the way in (the smoulder of ρ → 1), then the petals carry the picture
  SETTLE: 8,       // beats outside before the return (48 at a peak, as NAV)
  PEAK: 48,
  T_BACK: 1.2,     // s: the way back to the ball
  EPS: 0.004,      // ε in units of the component's size (1/|dλ/dc|) at `reach` −6; ×2^(reach + 6) — the brief's 1e-3 … 1e-2
  EPS_BEAT: 0.5,   // ε breathes by this fraction within each beat (ε is largest ON the beat line, decays to ε₀ before the next): the horn-map phase σ = frac(π/√ε) turns once per beat
  EPS_DROP: 2,     // ...and by this × dropEnv: the slam explodes the set furthest, then it settles
  W0: 0.02,        // |w| at which the petal coefficient a is measured (in z units, × the cycle's own scale ZS)
  PET_K: 0.03,     // the petal's radius R solves |a| R^q = PET_K (the contraction at the rim, 1 − RHO_WALL)
  PET_R: 1,        // × that radius: the petal scale
  GATE_FRAC: 0.3,  // the GATE is this fraction of the petal: the Lavaurs opening (|u| ~ √ε in the normal form) is far smaller than the petal, and a transit must leave it (2R) and come back — at the petal's own size the orbits of a cardioid root never left
  QMAX: 7,         // the Farey address the root is named by (q petals; θ near 0 or 1 → the cusp, 1 petal)
  ANY: 1,          // 1: dropEvt (the map's / the fake timeline's) fires the drop beside dropLiveEvt; 0 (&n3drop=live): the live slam only, as NAV2
  DROP_REFR: 4,    // beats after a drop before another may fire (the two detectors can name one drop a beat apart)
  ITER: 320,       // the shader's iteration budget while the implosion runs (§140 quality: was 420, the loop's hard cap — index.js scales it by the governor's q and caps it here)
  OUT_RUN: 2,      // × q₀ iterates beyond 2R before the next entry into R counts as a passage (the cycle's own alternation does not)
  SAMPLE: 8,       // orbits sampled per radius for the layer (n3info imp.passes / imp.esc; every 8th frame)
  SAMPLE_R: [0.3, 0.6, 0.9],   // × the petal radius Rp: the sample circles around z₀ — the former petal's inner, middle and outer zone
  FAN: [0, 1.45, -1.45, 1.5, -1.5, 1.4, -1.4, 1.55, -1.55, 1.3, -1.3, 1.6, -1.6, 1.2, -1.2, 1, -1, 0.5, -0.5, 2, -2, 2.5, -2.5, Math.PI],   // rad from n̂, nearest the wedge first: at a satellite root the exterior is the thin wedge between the two tangent components, α ∈ (π/2 − ε/2R_child, π/2 + ε/2R_parent) from the normal — at ε .014 and a 2/5 bulb (R .038) that is 1.39 … 1.59 rad
  LAM_STEP: 0.1,   // the continuation's step in λ toward e^{2πi p/q} (bulbChart's .1)
  ROOT_TOL: 1e-9,  // solveMult's residual for the root to count
  ROOT_FAR: 1.5,   // × the component's size: a root further than this from the secant estimate is a different component's — refused
};

// what index.js uploads: x the petal stage's weight, y the explosion's, z q (petals), w the gate radius R; z0, a, sig, and the record
export const IMP = { x: 0, y: 0, q: 1, q0: 1, R: 0.1, Rp: 0.3, z0: [0, 0], a: [0, 0], root: [0, 0], nrm: [1, 0], fan: 0, sig: 0, eps: 0, eps0: 0, passes: 0, esc: 0, escMax: 0, passMax: 0, n: 0, drops: 0, frames: 0, T: 0 };

const CY = mkCyc();
let st = null;   // the drop in flight: { from, root, n, size, Q, q, t, settled, beat0 }

// f^{n}(z) at c, iterated on the CPU
function iter(zr, zi, cr, ci, n) {
  for (let i = 0; i < n; i++) { const t = zr * zr - zi * zi + cr; zi = 2 * zr * zi + ci; zr = t; }
  return [zr, zi];
}

// the petal coefficient a of g(w) = w + a·w^{q+1} + … for g = f^{Q·q} at the parabolic point z₀ (c at the root)
function petalCoef(cr, ci, z0, Q, q, zs) {
  let ar = 0, ai = 0, n = 0;
  const w0 = OUT3.W0 * zs;
  for (let k = 0; k < 4; k++) {
    const ph = TAU * (k + 0.37) / 4, wr = w0 * Math.cos(ph), wi = w0 * Math.sin(ph);
    const g = iter(z0[0] + wr, z0[1] + wi, cr, ci, Q * q);
    const gr = g[0] - z0[0] - wr, gi = g[1] - z0[1] - wi;
    // w^{q+1} by polar, then (gr + i gi) / w^{q+1}
    const m = Math.pow(w0, q + 1), a = ph * (q + 1), pr = m * Math.cos(a), pi = m * Math.sin(a), d = pr * pr + pi * pi;
    if (!(d > 1e-300) || !isFinite(gr) || !isFinite(gi)) continue;
    ar += (gr * pr + gi * pi) / d; ai += (gi * pr - gr * pi) / d; n++;
  }
  return n ? [ar / n, ai / n] : [1, 0];
}

// The critical orbit's passages through the gate (the per-track table's "implosion frames" are the frames this is > 0). A passage
// is an entry into R around z₀ after OUT_RUN·q₀ consecutive iterates beyond 2R: near the period-q₀ cycle the f-orbit alternates
// between z₀'s neighbourhood and its partners' every iterate, and that alternation is not a transit — a transit leaves along the
// repelling direction, goes round the Julia set and comes back to the attracting side (the shader counts the same way).
const PS = { p: 0, esc: 0 };
export function passages(cr, ci, z0, R, q0 = 1, n = OUT3.ITER, zr = 0, zi = 0, out = PS) {
  const OR = OUT3.OUT_RUN * q0;
  let outr = OR, p = 0;
  out.esc = 0;
  for (let i = 0; i < n; i++) {
    const t = zr * zr - zi * zi + cr; zi = 2 * zr * zi + ci; zr = t;
    if (zr * zr + zi * zi > 1e8) { out.esc = 1; break; }
    const d = Math.hypot(zr - z0[0], zi - z0[1]);
    if (d < R) { if (outr >= OR) p++; outr = 0; } else if (d > 2 * R) outr++;
  }
  out.p = p;
  return p;
}
// The implosion's layer as the shader sees it, sampled: SAMPLE orbits on each SAMPLE_R·Rp circle around z₀ (the former petal's
// zones) — `esc` the fraction that ESCAPE inside the budget (the dust eating into the former interior: the implosion's depth) and
// `p` their mean passage count through the gate. The approach to a q-petal point is algebraic (~1/(q a r^q) iterations of f^Q
// from radius r), so the inner zone never reaches the gate inside the budget: the outer zones carry the picture.
const LY = { esc: 0, p: 0 };
export function layer(cr, ci, z0, Rp, R, q0, out = LY) {
  let s = 0, e = 0, n = 0;
  for (const rr of OUT3.SAMPLE_R) for (let k = 0; k < OUT3.SAMPLE; k++) {
    const a = TAU * (k + 0.5) / OUT3.SAMPLE;
    passages(cr, ci, z0, R, q0, OUT3.ITER, z0[0] + rr * Rp * Math.cos(a), z0[1] + rr * Rp * Math.sin(a), PS);
    s += PS.p; e += PS.esc; n++;
  }
  out.esc = e / n; out.p = s / n;
  return out;
}

// From nav.js on the drop while INT: N is the navigator (ball, cyc, grad GR, size, th), root the root estimate [x, y] and n̂ the
// outward normal (nav.js's cross() geometry), reach the depth parameter (log2, −10 … −2). Sets the OUT stage.
export function startDrop(N, S, root, nx, ny, reach) {
  const cy = N.cyc, r = nearestRational(N.th, OUT3.QMAX), q = Math.max(1, r.q);
  const zs = cy.q > 1 ? Math.sqrt(cy.eps2) / 0.4 : 1;   // the cycle's own spacing (field.js cycleEps2 = (.4·spacing)²), 1 on the cardioid
  // the root c₀ and its parabolic point z₀ to Newton precision: solveMult (mandel.js — a Newton solver in (z, c), no table) continued
  // from the ball's λ to e^{2πi p/q} in steps of ≤ LAM_STEP, as NAV's bulbChart did; the secant root + the rim's cycle point stand in
  // when the continuation fails (q = 1, the cusp: λ → 1 is where that Newton degenerates)
  const z0 = [cy.zr, cy.zi];
  if (q >= 2) {
    const st = { zr: cy.zr, zi: cy.zi, cr: N.ball[0], ci: N.ball[1] }, tr = Math.cos(TAU * r.p / q), ti = Math.sin(TAU * r.p / q);
    const dr = tr - cy.lr, di = ti - cy.li, steps = Math.max(1, Math.ceil(Math.hypot(dr, di) / OUT3.LAM_STEP));
    let res = 1;
    for (let k = 1; k <= steps && res < 1e-6 || k === 1; k++) res = solveMult(st, cy.q, cy.lr + dr * k / steps, cy.li + di * k / steps);
    if (res < OUT3.ROOT_TOL && Math.hypot(st.cr - root[0], st.ci - root[1]) < OUT3.ROOT_FAR * N.size) { root = [st.cr, st.ci]; z0[0] = st.zr; z0[1] = st.zi; }
  }
  const a = petalCoef(root[0], root[1], z0, cy.q, q, zs);
  const am = Math.hypot(a[0], a[1]) || 1;
  // the implosion DIRECTION: the parent's outward normal at a satellite root points INTO the child (the child hangs there — c₀ + n̂ε
  // is its slow attracting cycle, not an implosion); the exterior of M lies to the sides. A fan around n̂ is probed with field.js's
  // escapes() (the exterior Green's potential, no table) at ε₀ and 4ε₀, and the first direction that leaves M on both is taken.
  const eps0 = OUT3.EPS * Math.pow(2, reach + 6) * N.size;
  let dx = nx, dy = ny, found = 0;
  for (const da of OUT3.FAN) {
    const ca = Math.cos(da), sa = Math.sin(da), ex = nx * ca - ny * sa, ey = nx * sa + ny * ca;
    if (escapes(root[0] + ex * eps0, root[1] + ey * eps0) && escapes(root[0] + ex * eps0 * 4, root[1] + ey * eps0 * 4)) { dx = ex; dy = ey; found = 1; break; }
  }
  IMP.fan = found;
  IMP.q = q; IMP.q0 = cy.q; IMP.z0 = z0; IMP.a = a; IMP.root = root; IMP.nrm = [dx, dy]; IMP.Rp = OUT3.PET_R * Math.pow(OUT3.PET_K / am, 1 / q); IMP.R = OUT3.GATE_FRAC * IMP.Rp; IMP.x = 0; IMP.y = 0; IMP.sig = 0;
  IMP.eps0 = eps0; IMP.eps = eps0; IMP.drops++; IMP.passes = 0; IMP.esc = 0; IMP.escMax = 0; IMP.passMax = 0;
  st = { from: [N.ball[0], N.ball[1]], root, nx: dx, ny: dy, t: 0, beat0: S.beatCount, cyc: cy, p: r.p };
  N.mode = 'OUT';
  N.extBeat = S.beatCount;
  N.timeScale = 2.6;
  N.kick.set(0);
  N.log('DROP@' + (S.beatCount | 0) + ' root ' + root.map((x) => x.toFixed(6)) + ' ' + r.p + '/' + q + ' a ' + a.map((x) => x.toExponential(2)) + ' R ' + IMP.R.toExponential(2) + ' eps ' + IMP.eps0.toExponential(2));
  return 1;
}

// Once per updateNav while N.mode is OUT / EXT / IN: moves cPath, the stage weights, ε and σ; the chart (cyc.has) and par.
export function stepDrop(N, S, dt, idle) {
  const X = st;
  if (!X) { N.mode = 'INT'; return; }
  if (N.mode === 'OUT') {   // the way in: ball → root, the petals lighting, the chart held then released at the root
    X.t = Math.min(1, X.t + dt / OUT3.T_IN);
    const u = sstep(0, 1, X.t);
    N.cPath[0] = mix(X.from[0], X.root[0], u);
    N.cPath[1] = mix(X.from[1], X.root[1], u);
    IMP.x = sstep(OUT3.PET_FROM, 1, u); IMP.y = 0;   // the petals exist only AT the root (before it the attracting cycle still wins and the Fatou coordinate does not exist): they fade in over the last stretch
    N.cyc.has = u < OUT3.CHART_TO ? 1 : 0;   // the chart (the Koenigs bands, ρ → 1: the critical slowing) holds until then
    N.par = u;
    if (X.t >= 1) { N.mode = 'EXT'; X.t = 0; N.ball[0] = X.root[0]; N.ball[1] = X.root[1]; }
  } else if (N.mode === 'EXT') {   // the way out: c₀ + n̂·ε(t), ε breathing with the beat and the slam
    X.t += dt;
    const bp = isFinite(S.beatPhase) ? clamp(S.beatPhase, 0, 1) : 0;
    IMP.eps = IMP.eps0 * (1 + OUT3.EPS_BEAT * (1 - bp) + OUT3.EPS_DROP * (S.dropEnv || 0));
    N.cPath[0] = X.root[0] + X.nx * IMP.eps;
    N.cPath[1] = X.root[1] + X.ny * IMP.eps;
    N.ball[0] = N.cPath[0]; N.ball[1] = N.cPath[1];
    IMP.x = Math.max(0, IMP.x - dt / 0.5); IMP.y = Math.min(1, IMP.y + dt / 0.5);
    IMP.T = Math.PI / Math.sqrt(Math.max(IMP.eps / N.size, 1e-12));   // the transit in iterations for ε in component units (the q = 1 normal form)
    IMP.sig = IMP.T - Math.floor(IMP.T);
    IMP.frames++;
    if ((IMP.n++ & 7) === 0) { const L = layer(N.cPath[0], N.cPath[1], IMP.z0, IMP.Rp, IMP.R, IMP.q0); IMP.passes = L.p; IMP.esc = L.esc; IMP.escMax = Math.max(IMP.escMax, L.esc); IMP.passMax = Math.max(IMP.passMax, L.p); }   // the layer, every 8th frame (24 orbits × ITER)
    N.cyc.has = 0;
    N.par = 0;
    const settle = (S.arc !== 'peak' && S.beatCount - X.beat0 > OUT3.SETTLE) || S.beatCount - X.beat0 > OUT3.PEAK || idle;
    if (settle && (S.dropEnv || 0) < 0.2) { N.mode = 'IN'; X.t = 0; X.out = [N.cPath[0], N.cPath[1]]; }
  } else {   // IN: the way back to the ball; the chart is restored at the end
    X.t = Math.min(1, X.t + dt / OUT3.T_BACK);
    const u = sstep(0, 1, X.t);
    N.cPath[0] = mix(X.out[0], X.from[0], u);
    N.cPath[1] = mix(X.out[1], X.from[1], u);
    IMP.y = Math.max(0, 1 - u * 1.5);
    N.cyc.has = 0;
    N.par = u;
    if (X.t >= 1) {
      N.ball[0] = X.from[0]; N.ball[1] = X.from[1];
      const c2 = findCycle(X.from[0], X.from[1], CY, N_MAX);
      if (c2.has && c2.q === X.cyc.q) Object.assign(N.cyc, { zr: c2.zr, zi: c2.zi, lr: c2.lr, li: c2.li, rho: c2.rho, arg: c2.arg, res: c2.res, eps2: c2.eps2 });
      N.cyc.has = 1;
      N.mode = 'INT';
      N.landed = S.beatCount;
      IMP.x = IMP.y = 0;
      st = null;
    }
  }
}

// &n3drop=live: the live detector's slam only (NAV2's read); anything else: both detectors (OUT3.ANY)
export function knobDrop(v) { OUT3.ANY = String(v) === 'live' ? 0 : 1; return OUT3.ANY; }
// &n3imp=EPS[,EPS_BEAT[,EPS_DROP[,PET_K[,PET_R[,T_IN[,SETTLE]]]]]]
export function knobImp(v) {
  const s = String(v === undefined || v === null ? '' : v);
  if (s === '' || s === '1') return Object.assign({}, OUT3);   // a bare call READS (CARD.hooks.n3imp() from the console; &n3imp alone in the URL)
  const nums = s.split(',').map(Number);
  if (!nums.length || nums.some((x) => !isFinite(x))) return null;
  ['EPS', 'EPS_BEAT', 'EPS_DROP', 'PET_K', 'PET_R', 'T_IN', 'SETTLE'].forEach((k, i) => { if (i < nums.length) OUT3[k] = nums[i]; });
  return nums;
}
