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
// §143 (the drop on a delicate piece): the drop is the live slam, the map's line OR the engine's energy shift (`shiftEvt`); EXT HOLDS
// while the energy is still up (`shiftHold`) and the SETTLE beats count from the hold's end (PEAK stays the hard cap); a drop or a
// shift that lands during OUT / EXT / IN RE-ARMS the implosion (rearm(): beat0 reset, the slam's own ε pulse, IN turned back into OUT
// from where it is) instead of being discarded — Comptine's 52.17 arm was lost mid-implosion that way. v3's dropEvt is no longer
// read by default (OUT3.ANY 0 — NAV2 never did; `&n3drop=any` restores it).
// The root c₀ and its parabolic point z₀ are solved, not tabulated: mandel.js's solveMult (a Newton in (z, c) onto the target
// multiplier) continued from the ball's λ. The petal coefficient a is measured: a = mean over four directions of
// (g(z₀ + w) − z₀ − w) / w^{q+1} at |w| = W0 — g = f^{Q·q} iterated on the CPU once per drop — at the ROOT (at the rim's cycle
// point the linear term swamps it). The petal radius Rp = PET_R·(PET_K/|a|)^{1/q}, the gate R = GATE_FRAC·Rp; layer() is the
// CPU ruler of the explosion (the escape fraction of the former petal's zones inside the budget, their mean passage count).
// Maths after Douady–Hubbard (the parabolic root points of M), Lavaurs (1989, the implosion and its phase), Shishikura (the
// Fatou coordinates and the horn map; LMS 274, 2000) and Inou–Mukherjee (2016, the horn map's translation constant σ); the
// user's notes on both (MandelBound theory/t-parab-horn-map-p24-p50.md, QuantumComputing's cardioid-cusp toolkit) are the brief.
// §144 (the look pass, the user's two Comptine captures): the hold's picture — ε₀ ×4 (EPS .016) so the dust visibly eats inward; the
// former interior BLACK while the implosion is up (shaders-v2.js, OUT3.BLACK), the petals painted on the way in only; the dust's depth
// follows the loudness ladder (HOLD_LOUD on N.loud, eased over HOLD_TAU) and the implosion's DIRECTION turns slowly round the root
// inside the exterior wedge (TURN_BARS / TURN_MAX: c = c₀ + ε·e^{iφ(t)}·d̂ — Lavaurs' phase changes with arg ε, the imploded set morphs
// continuously); ε breathes on the EASED beat (move2.js's crest profile, continuous — the per-beat sawtooth snapped the horn-map phase
// 9× a beat); v3's dropEnv no longer pumps ε unless v3's drop is the trigger (&n3drop=any) — the drop's own pulse is IMP.slam; the
// horn-map phase σ is off the exterior tint (SIG_TINT 0: the far exterior's hue swept .3 of the wheel and snapped back).
// Pure state + numbers: no GL. index.js uploads IMP; nav.js calls startDrop() / stepDrop().
import { clamp, mix, sstep, ema, TAU } from '../../math/util.js';
import { findCycle, mkCyc, N_MAX, nearestRational, escapes } from '../../math/field.js';
import { solveMult } from '../../math/mandel.js';   // Newton in (z, c) onto a target multiplier — a solver, not a table (BULBS and the ray grid stay unused)
import { M2 } from './move2.js';   // §144: the beat profile's crest (continuous) is ε's breath

export const OUT3 = {
  T_IN: 1.4,       // s: the way in — from the ball to the root, the petals lighting
  PET_FROM: 0.6,   // the petal layer fades in from this fraction of the way in (0 at PET_FROM, 1 at the root)
  CHART_TO: 0.85,  // the Koenigs chart holds until this fraction of the way in (the smoulder of ρ → 1), then the petals carry the picture
  SETTLE: 8,       // beats outside before the return (48 at a peak, as NAV) — §143: counted from the end of the energy hold when there is one
  HOLD: 1,         // §143: 1 = EXT holds while the engine's shiftHold is 1 (the energy is still up), then the SETTLE beats; 0 = the fixed settle
  HOLD_MAX: 32,    // §143: beats the energy hold may keep EXT at most (Comptine's 52 → 1:07 is 27; a dance track's drop section stays up for a minute — without a cap every drop held to PEAK, 19–25 s); the SETTLE beats follow
  REARM: 1,        // §143: 1 = a drop / shift during OUT / EXT / IN re-arms the implosion; 0 = discarded (v0.43)
  SLAM_T: 2,       // beats: the re-arm's own ε pulse (IMP.slam, the EPS_DROP term when v3's dropEnv is not the trigger's) decays over this
  PEAK: 48,
  T_BACK: 1.2,     // s: the way back to the ball
  EPS: 0.016,      // ε in units of the component's size (1/|dλ/dc|) at `reach` −6; ×2^(reach + 6) — §144: was .004 (the hold read esc ≤ .04: a black blob with a dust rim); ×4 reads .3–.4 at the hold's floor, the dust eating in
  EPS_BEAT: 0.15,  // §145: ε × (1 + EPS_BEAT × the crest × the percussiveness scale) — a small FIXED breath (×1.15 on a kit's beat line, ×1.03 on a piano), no longer a share of the floor-to-top walk (that read ×1.5 per beat on a 3× bracket: "looping"); §144's .25 of the walk (move2.js M2.crest: 1 on a plain beat's line, 1.5 on the downbeat, 0 between — continuous; §144: was (1 − beatPhase), a sawtooth that snapped ε ×1.5 on every line)
  SHIFT_SLAM: 0.3, // §145: the slam pulse's size when the trigger is the engine's energy SHIFT (a live / map slam gets 1): on a shift the full pulse put 34 % past the top on Comptine 34.4 s — the whole former interior to dust
  IMP_TIME: 0,     // §145: the palette / spoke clock's rate while the implosion is up (nav.js vtime): 0 = FROZEN — the hold keeps the hue it imploded in (the drift at 1/s walked a full wheel per 17 s hold: "looping"); 1 = fd49b87's drift
  TURN_ONEWAY: 1,  // §145: 1 = the direction's sweep is ONE-WAY (from the wedge's middle toward its edge at TURN_MAX / TURN_BARS rad per bar, stopping at the edge or TURN_MAX); 0 = fd49b87's there-and-back sine (a 4-bar loop)
  PET_Q1: 0,       // §145: 1 = the petal paint at a q 1 (cusp) root too; 0 = none there (at the cusp the Fatou bands are circles tangent at z₀, pulled back to every preimage: the 33 s "circle blobs")
  EPS_DROP: 1,     // ...and by this × the slam's pulse (§144: the whole floor-to-top walk, on top of the ladder's — the set explodes furthest on the slam; was 2 × ε₀) (IMP.slam, 1 at the drop and at a re-arm, decaying over SLAM_T beats; §144: v3's dropEnv is read here only with ANY — it pumped the hold's ε to dust for a second on every v3 hit, Comptine 59 / 68)
  ESC_FLOOR: 0.3,  // §144: ε₀ is CALIBRATED per drop so the layer's escape fraction (layer(): the former petal's three zones inside the budget) reads this at the hold's floor — a bisection in log ε inside [EPS/ESC_SPAN, EPS·ESC_SPAN] × the component's size, ESC_STEPS probes of 24 orbits each, once per drop. Measured (the look pass's scan): the fraction is a cliff whose place depends on the root — a cusp (q 1) goes .00 → .96 between ε/size .008 and .016, a q 4–7 root needs .03–.06 for .3 — so one EPS is dust at one root and a black blob at the next. 0 = off (EPS as is, v0.43's rule)
  ESC_TOP: 0.8,    // §144: ...and ε_hi where it reads this: the hold's depth at the loudness ladder's top (drive 1); the slam goes past it
  DRIVE_MAX: 1.6,  // §144: the drive's cap (the slam's pulse on top of a loud ladder: ε_hi × (ε_hi/ε_lo)^.6 at most)
  ESC_SPAN: 4,     // the bracket's half-width in log ε (×/÷ EPS: ε/size .004 … .064 at reach −6; a deep root (period ≥ 14) never reaches the floor inside the budget and sits at the top edge)
  ESC_STEPS: 8,    // bisection steps (8 → ε to 2^(6/256) ≈ 1.6 %)
  HOLD_LOUD: 1,    // §144: ...and by this × the loudness ladder (N.loud, eased over HOLD_TAU s): the dust's depth follows the energy through a hold — quiet = the floor (EPS), loud = (1 + HOLD_LOUD)×; 0 = off
  HOLD_TAU: 1,     // s
  TURN_BARS: 4,    // §144: the implosion's direction sweeps round the root inside the exterior wedge, a full sine cycle per TURN_BARS bars (0 = off: the fan's own direction, v0.43)
  TURN_MAX: 0.5,   // rad: the half-sweep's cap (at the cusp the exterior is nearly the whole circle; at a satellite root the wedge is ~.2 rad and the sweep stays inside it)
  TURN_MARGIN: 0.15, // the fraction of the wedge's half-width kept clear on each side
  WEDGE_STEP: 0.02, // rad: the probe's step when the wedge is measured (escapes() at ε₀ and 4ε₀, from the fan's direction outward)
  SIG_TINT: 0,     // §144: the horn-map phase σ's weight on the exterior layer's and the petals' hue (v0.43: .3 — σ wraps 9× a beat, the far exterior's hue swept and snapped: "spiraling should be smooth")
  BLACK: 1,        // §144: 1 = a non-escaped pixel with no chart is BLACK while the implosion is up and the petal layer paints on the way in only; 0 = v0.43 (the .03 base + the line trap, the petals on both ways: the blobby artifacts)
  W0: 0.02,        // |w| at which the petal coefficient a is measured (in z units, × the cycle's own scale ZS)
  PET_K: 0.03,     // the petal's radius R solves |a| R^q = PET_K (the contraction at the rim, 1 − RHO_WALL)
  PET_R: 1,        // × that radius: the petal scale — §142: the petal LAYER is confined to it (mix × exp(−r/(PET_R·Rp)))
  PET_LUM: 0.08,   // §142: the petal layer's base lightness (was .22 in the shader: the whole interior a flat wash for the drop's six seconds)
  GATE_FRAC: 0.3,  // the GATE is this fraction of the petal: the Lavaurs opening (|u| ~ √ε in the normal form) is far smaller than the petal, and a transit must leave it (2R) and come back — at the petal's own size the orbits of a cardioid root never left
  QMAX: 7,         // the Farey address the root is named by (q petals; θ near 0 or 1 → the cusp, 1 petal)
  ANY: 0,          // §143: 0 — v3's dropEvt is not read (NAV2 never did; a piano's false drops came in by it); 1 (&n3drop=any): dropEvt fires the drop too. The fake timeline (#test) leaves on its own shiftEvt now
  DROP_REFR: 4,    // beats after a drop before another may fire (the two detectors can name one drop a beat apart)
  ITER: 320,       // the shader's iteration budget while the implosion runs (§140 quality: was 420, the loop's hard cap — index.js scales it by the governor's q and caps it here)
  IMP_COL: 1,      // §145: 1 = a gate-passed escaped pixel (the former interior) is drawn by its ESCAPE TIME while the implosion is up — the key's hue, luma bands cos(2π·sn·IMP_SN), no halo / trap / dust / flash terms (they read .69 px from a boundary everywhere: a flat saturated fill); 0 = fd49b87 (the exterior branch)
  IMP_SN: 0.035,   // §145: the luma bands' rate per unit of the smooth escape count (the exterior's own .035)
  IMP_HUE_SN: 0.01, // §145: the hue's spread per unit of sn around the key (0 = one hue)
  IMP_LUM: 0.22,   // §145: the former interior's base lightness in the escape-time colour (+ .14 per gate passage)
  IMP_N: 30,       // §145: a pixel whose smooth escape count passes this is the former interior's too (the true exterior near the set escapes in ~10–25 at the hold's ε; the slam's ε empties the former interior without a gate passage)
  OUT_RUN: 2,      // × q₀ iterates beyond 2R before the next entry into R counts as a passage (the cycle's own alternation does not)
  SAMPLE: 8,       // orbits sampled per radius for the layer (n3info imp.passes / imp.esc; every 8th frame)
  SAMPLE_R: [0.3, 0.6, 0.9],   // × the petal radius Rp: the sample circles around z₀ — the former petal's inner, middle and outer zone
  FAN: [0, 1.45, -1.45, 1.5, -1.5, 1.4, -1.4, 1.55, -1.55, 1.3, -1.3, 1.6, -1.6, 1.2, -1.2, 1, -1, 0.5, -0.5, 2, -2, 2.5, -2.5, Math.PI],   // rad from n̂, nearest the wedge first: at a satellite root the exterior is the thin wedge between the two tangent components, α ∈ (π/2 − ε/2R_child, π/2 + ε/2R_parent) from the normal — at ε .014 and a 2/5 bulb (R .038) that is 1.39 … 1.59 rad
  LAM_STEP: 0.1,   // the continuation's step in λ toward e^{2πi p/q} (bulbChart's .1)
  ROOT_TOL: 1e-9,  // solveMult's residual for the root to count
  ROOT_FAR: 1.5,   // × the component's size: a root further than this from the secant estimate is a different component's — refused
};

// what index.js uploads: x the petal stage's weight, y the explosion's, z q (petals), w the gate radius R; z0, a, sig, and the record
export const IMP = { x: 0, y: 0, q: 1, q0: 1, R: 0.1, Rp: 0.3, z0: [0, 0], a: [0, 0], root: [0, 0], nrm: [1, 0], fan: 0, sig: 0, eps: 0, eps0: 0, passes: 0, esc: 0, escMax: 0, passMax: 0, n: 0, drops: 0, frames: 0, T: 0, slam: 0, rearms: 0, held: 0, phi: 0, wedge: [0, 0], loudE: 0, epsHi: 0, drive: 0 };   // §143: slam = the re-arm's ε pulse, rearms = the count, held = frames EXT was held by shiftHold; §144: phi = the direction's angle from the fan's (rad), wedge = the exterior wedge's bounds from the normal, loudE = the eased ladder, epsHi = the calibrated top, drive = the energy 0..DRIVE_MAX

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
export function startDrop(N, S, root, nx, ny, reach, kind = 'slam') {   // §145: kind 'slam' (live / map) or 'shift' (the engine's energy shift): the slam pulse's size
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
  let eps0 = OUT3.EPS * Math.pow(2, reach + 6) * N.size;
  const outAt = (da, e = eps0) => { const ca = Math.cos(da), sa = Math.sin(da), ex = nx * ca - ny * sa, ey = nx * sa + ny * ca; return escapes(root[0] + ex * e, root[1] + ey * e) && escapes(root[0] + ex * e * 4, root[1] + ey * e * 4); };
  let dx = nx, dy = ny, found = 0, a0 = 0;
  for (const da of OUT3.FAN) if (outAt(da)) { a0 = da; found = 1; break; }
  const Rp = OUT3.PET_R * Math.pow(OUT3.PET_K / am, 1 / q), Rg = OUT3.GATE_FRAC * Rp;
  // §144: the wedge — how far round the root the exterior reaches on either side of the fan's direction (probed at ε₀ and 4ε₀ in
  // WEDGE_STEP rad steps, at most a half turn each way); the hold's direction sweeps inside it (stepDrop EXT) about its MIDDLE, which is
  // the implosion's direction now (the fan's own when TURN_BARS is 0). No exterior found: no wedge, the normal.
  let aLo = a0, aHi = a0;
  if (found) {
    while (a0 - aLo < Math.PI && outAt(aLo - OUT3.WEDGE_STEP)) aLo -= OUT3.WEDGE_STEP;
    while (aHi - a0 < Math.PI && outAt(aHi + OUT3.WEDGE_STEP)) aHi += OUT3.WEDGE_STEP;
  }
  const aMid = found && OUT3.TURN_BARS > 0 ? 0.5 * (aLo + aHi) : a0;
  dx = nx * Math.cos(aMid) - ny * Math.sin(aMid); dy = nx * Math.sin(aMid) + ny * Math.cos(aMid);
  // §144: the calibrated depth — ε_lo where the former petal's escape fraction (layer()) is ESC_FLOOR and ε_hi where it is ESC_TOP, along
  // the sweep's middle: a bisection in log ε over the bracket for each (the fraction rises with ε; the bracket's edge stands when it never
  // crosses). The hold then moves between them by the energy (stepDrop EXT): the depth of the eating is the same on every root
  let epsHi = eps0 * 2;
  if (OUT3.ESC_FLOOR > 0 && found) {
    const escAt = (e) => layer(root[0] + dx * e, root[1] + dy * e, z0, Rp, Rg, cy.q).esc;
    const solve = (target) => {
      let lo = Math.log(eps0 / OUT3.ESC_SPAN), hi = Math.log(eps0 * OUT3.ESC_SPAN);
      if (escAt(Math.exp(lo)) >= target) hi = lo; else if (escAt(Math.exp(hi)) < target) lo = hi;
      else for (let k = 0; k < OUT3.ESC_STEPS; k++) { const m = 0.5 * (lo + hi); if (escAt(Math.exp(m)) >= target) hi = m; else lo = m; }
      return Math.exp(hi);
    };
    eps0 = solve(OUT3.ESC_FLOOR);
    epsHi = Math.max(eps0 * 1.0001, solve(Math.max(OUT3.ESC_TOP, OUT3.ESC_FLOOR)));
  }
  IMP.fan = found;
  IMP.q = q; IMP.q0 = cy.q; IMP.z0 = z0; IMP.a = a; IMP.root = root; IMP.nrm = [dx, dy]; IMP.Rp = Rp; IMP.R = Rg; IMP.x = 0; IMP.y = 0; IMP.sig = 0;
  IMP.eps0 = eps0; IMP.epsHi = epsHi; IMP.eps = eps0; IMP.drops++; IMP.passes = 0; IMP.esc = 0; IMP.escMax = 0; IMP.passMax = 0; IMP.phi = 0; IMP.wedge = [aLo - aMid, aHi - aMid]; IMP.loudE = N.loud;
  st = { from: [N.ball[0], N.ball[1]], start: [N.ball[0], N.ball[1]], root, nx, ny, a0: aMid, aLo, aHi, bar0: N.bar, t: 0, beat0: S.beatCount, hold: S.beatCount, cyc: cy, p: r.p };   // §143: start = where the way in begins (the ball, or a re-arm's c); hold = the last beat the energy was up; §144: nx/ny = the NORMAL, a0 the direction's angle from it (the wedge's middle), aLo/aHi the wedge
  IMP.slam = kind === 'shift' ? OUT3.SHIFT_SLAM : 1;   // §144: the drop's own ε pulse (§145: SHIFT_SLAM on a shift) (the slam explodes the set furthest, then it settles over SLAM_T beats) — v3's envelope no longer stands in
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
    N.cPath[0] = mix(X.start[0], X.root[0], u);
    N.cPath[1] = mix(X.start[1], X.root[1], u);
    IMP.x = sstep(OUT3.PET_FROM, 1, u); IMP.y = 0;   // the petals exist only AT the root (before it the attracting cycle still wins and the Fatou coordinate does not exist): they fade in over the last stretch
    N.cyc.has = u < OUT3.CHART_TO ? 1 : 0;   // the chart (the Koenigs bands, ρ → 1: the critical slowing) holds until then
    N.par = u;
    if (X.t >= 1) { N.mode = 'EXT'; X.t = 0; X.bar0 = N.bar; N.ball[0] = X.root[0]; N.ball[1] = X.root[1]; }
  } else if (N.mode === 'EXT') {   // the way out: c₀ + d̂·ε(t), ε breathing with the beat, the slam and the ladder, d̂ sweeping the wedge
    X.t += dt;
    IMP.slam *= Math.exp(-dt / Math.max(0.05, OUT3.SLAM_T * 60 / (S.bpm > 40 ? S.bpm : 124)));   // §143: the re-arm's pulse
    IMP.loudE = ema(IMP.loudE, N.loud, dt, OUT3.HOLD_TAU);   // §144: the dust's depth follows the loudness ladder, eased
    const crest = isFinite(M2.crest) ? clamp(M2.crest, 0, 2) : 0;   // §144: the beat profile's crest — continuous, 1 on the line, 0 between
    const drive = OUT3.EPS_DROP * Math.max(IMP.slam, OUT3.ANY ? S.dropEnv || 0 : 0) + OUT3.HOLD_LOUD * IMP.loudE;   // the energy: the slam's pulse, the ladder (§145: the beat's crest is a fixed small breath on top, below)
    IMP.drive = drive;
    // §144: calibrated (ESC_FLOOR > 0): ε walks in log from the floor (drive 0: esc ESC_FLOOR) to the top (drive 1: ESC_TOP) and past it on
    // the slam (drive up to DRIVE_MAX); uncalibrated: v0.43's linear breath on ε₀
    IMP.eps = (OUT3.ESC_FLOOR > 0 ? IMP.eps0 * Math.pow(IMP.epsHi / IMP.eps0, clamp(drive, 0, OUT3.DRIVE_MAX)) : IMP.eps0 * (1 + drive)) * (1 + OUT3.EPS_BEAT * crest * (N.percS === undefined ? 1 : N.percS));   // §145: the breath absolute × the percussiveness scale
    // §144: the direction turns round the root inside the wedge: a sine of TURN_BARS bars about the wedge's middle, the half-sweep capped
    const half = OUT3.TURN_BARS > 0 ? Math.min(OUT3.TURN_MAX, 0.5 * (X.aHi - X.aLo) * (1 - OUT3.TURN_MARGIN)) : 0;
    const mid = half > 0 ? 0.5 * (X.aLo + X.aHi) : X.a0;
    const phi = OUT3.TURN_ONEWAY ? mid + Math.min(half, OUT3.TURN_MAX * (N.bar - X.bar0) / Math.max(OUT3.TURN_BARS, 1e-6)) : mid + half * Math.sin(TAU * (N.bar - X.bar0) / Math.max(OUT3.TURN_BARS, 1e-6));   // §145: one way from the middle toward the edge, never back
    IMP.phi = phi - X.a0;
    const ca = Math.cos(phi), sa = Math.sin(phi), ex = X.nx * ca - X.ny * sa, ey = X.nx * sa + X.ny * ca;
    IMP.nrm[0] = ex; IMP.nrm[1] = ey;
    N.cPath[0] = X.root[0] + ex * IMP.eps;
    N.cPath[1] = X.root[1] + ey * IMP.eps;
    N.ball[0] = N.cPath[0]; N.ball[1] = N.cPath[1];
    IMP.x = Math.max(0, IMP.x - dt / 0.5); IMP.y = Math.min(1, IMP.y + dt / 0.5);
    IMP.T = Math.PI / Math.sqrt(Math.max(IMP.eps / N.size, 1e-12));   // the transit in iterations for ε in component units (the q = 1 normal form)
    IMP.sig = IMP.T - Math.floor(IMP.T);
    IMP.frames++;
    if ((IMP.n++ & 7) === 0) { const L = layer(N.cPath[0], N.cPath[1], IMP.z0, IMP.Rp, IMP.R, IMP.q0); IMP.passes = L.p; IMP.esc = L.esc; IMP.escMax = Math.max(IMP.escMax, L.esc); IMP.passMax = Math.max(IMP.passMax, L.p); }   // the layer, every 8th frame (24 orbits × ITER)
    N.cyc.has = 0;
    N.par = 0;
    // §143: the energy hold — while shiftHold is 1 the exterior stays (IMP.held counts the frames) and the settle counts from the hold's
    // last beat; PEAK (from the drop itself) and silence end it regardless
    const held = OUT3.HOLD && (S.shiftHold || 0) > 0 && S.beatCount - X.beat0 <= OUT3.HOLD_MAX;
    if (held) { X.hold = S.beatCount; IMP.held++; }
    const capped = S.beatCount - X.beat0 > OUT3.PEAK || idle;
    const settle = capped || (!held && S.arc !== 'peak' && S.beatCount - Math.max(X.beat0, X.hold) > OUT3.SETTLE);
    if (settle && (capped || (S.dropEnv || 0) < 0.2)) { N.mode = 'IN'; X.t = 0; X.out = [N.cPath[0], N.cPath[1]]; }
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

// §143: a drop or a shift while the implosion runs RE-ARMS it: beat0 and the hold reset (the settle starts over), the slam's own ε pulse
// (IMP.slam → 1: the set explodes furthest on this beat as on the first drop); during IN the way back is abandoned — the way in starts
// over from where c is (st.start = cPath: continuous, the petals light again, then EXT). Returns 1 when something was re-armed.
export function rearm(N, S, kind = 'slam') {
  const X = st;
  if (!X || !OUT3.REARM) return 0;
  X.beat0 = S.beatCount; X.hold = S.beatCount; IMP.slam = Math.max(IMP.slam, kind === 'shift' ? OUT3.SHIFT_SLAM : 1); IMP.rearms++;
  if (N.mode === 'IN') { X.start = [N.cPath[0], N.cPath[1]]; X.t = 0; IMP.x = 0; IMP.y = 0; N.mode = 'OUT'; N.timeScale = 2.6; }
  N.extBeat = S.beatCount;
  N.log('REARM@' + (S.beatCount | 0) + ' ' + N.mode);
  return 1;
}
// &n3drop=any: v3's dropEvt fires the drop too (v0.43's read); &n3drop=live / anything else: the live slam, the map's line and the shift (OUT3.ANY 0, §143)
export function knobDrop(v) { OUT3.ANY = String(v) === 'any' ? 1 : 0; return OUT3.ANY; }
// &n3imp=EPS[,EPS_BEAT[,EPS_DROP[,PET_K[,PET_R[,T_IN[,SETTLE[,PET_LUM[,HOLD[,REARM[,HOLD_MAX[,HOLD_LOUD[,TURN_BARS[,TURN_MAX[,SIG_TINT[,BLACK[,ESC_FLOOR[,ESC_TOP[,SHIFT_SLAM[,IMP_TIME[,TURN_ONEWAY[,PET_Q1[,IMP_COL[,IMP_LUM[,IMP_N]]]]]]]]]]]]]]]]]]]]]]]]
//   v0.43's hold: &n3imp=0.004,0.5,2,0.03,1,1.4,8,0.08,1,1,32,0,0,0.5,0.3,0,0 (ε₀ .004 uncalibrated, the linear breath, no ladder depth, no sweep, σ on the tint, the petals both ways)
export function knobImp(v) {
  const s = String(v === undefined || v === null ? '' : v);
  if (s === '' || s === '1') return Object.assign({}, OUT3);   // a bare call READS (CARD.hooks.n3imp() from the console; &n3imp alone in the URL)
  const nums = s.split(',').map(Number);
  if (!nums.length || nums.some((x) => !isFinite(x))) return null;
  ['EPS', 'EPS_BEAT', 'EPS_DROP', 'PET_K', 'PET_R', 'T_IN', 'SETTLE', 'PET_LUM', 'HOLD', 'REARM', 'HOLD_MAX', 'HOLD_LOUD', 'TURN_BARS', 'TURN_MAX', 'SIG_TINT', 'BLACK', 'ESC_FLOOR', 'ESC_TOP', 'SHIFT_SLAM', 'IMP_TIME', 'TURN_ONEWAY', 'PET_Q1', 'IMP_COL', 'IMP_LUM', 'IMP_N'].forEach((k, i) => { if (i < nums.length) OUT3[k] = nums[i]; });   // §143: HOLD / REARM / HOLD_MAX the ninth to eleventh; §144: HOLD_LOUD … ESC_TOP the twelfth to eighteenth; §145: SHIFT_SLAM … IMP_LUM the nineteenth to twenty-fourth (fd49b87: 1,1,0,1,0,0 — the full pulse on a shift, the drift, the sine sweep, the cusp's petals, the exterior branch; EPS_BEAT .25 was a share of the walk, not comparable)
  return nums;
}
