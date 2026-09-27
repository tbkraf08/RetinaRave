// NAV2's ruler, by Green's theorem (v0.13, the user: "no beat == more of a circle … the edge of the set should always be
// moving with the music. How can Green's theorem help?"). The Julia set's edge is a fractal — its length is infinite and
// "how round is it" has no answer on the edge itself — but its EQUIPOTENTIALS are smooth closed curves that shrink onto
// it, and Green's theorem turns a boundary trace into the numbers the user's sentences need:
//   area        A = 1/2 ∮ (x dy − y dx)          (Green with L = −y/2, M = x/2 — the shoelace sum on the polygon)
//   roundness   Q = 4 π A / L²                   (1 for a circle, less for anything else — the isoperimetric quotient)
//   edge motion dA/dt = ∮ (v · n) ds             (the divergence theorem, Green's other face: the area's rate of change
//                                                 is the flux of the boundary's velocity), plus the mean |v| along it
// so "no beat = a circle" reads Q → 1 and "the edge always moves" reads v > 0 — measured, not asserted. Gronwall's area
// theorem (Green again, applied to the Böttcher map ψ_c(w) = w + a₀ + a₁/w + …) says A = π(R² − Σ n|aₙ|² R⁻²ⁿ): the gap
// between A and the disc's π R² IS the weight of the Laurent tail, i.e. how far the set is from round. c = 0 has ψ = id,
// Q = 1 exactly; |c| small gives a quasi-circle; c near the rim (ρ = |λ| → 1) gives arms and Q falls.
// The trace: N points of the equipotential |φ_c| = R_T, pulled back from a large circle |w| = R_T^(2^DEPTH) (where
// ψ ≈ id) by DEPTH inverse iterations z ← ±sqrt(z − c). Level m at external angle t is level m−1 at angle 2t (φ(f(z)) =
// φ(z)²), so on a grid of N angles the pull-back is index 2j mod N, and the branch is the one continuous in j — for a
// connected K_c (c ∈ M) the curve closes and the sign flips once per turn by itself. Pure math, no wall clock.
export const N_PTS = 256;        // points on the curve (a polygon: Q of the N-gon of a circle is 1 − O(1/N²))
export const DEPTH = 7;          // pull-backs: R_OUT = R_T^(2^7); ψ(w) − w = O(1/|w|) there
export const R_T = 1.06;         // the level: |φ_c| = 1.06 hugs the set (log₂ log R_T ≈ −4.1) without the fractal detail
                                 // N points cannot follow; it is the same equipotential family exit.js navigates by
const X = new Float64Array(N_PTS), Y = new Float64Array(N_PTS);       // the curve this frame
const X0 = new Float64Array(N_PTS), Y0 = new Float64Array(N_PTS);     // ... and the previous one, for v
const TX = new Float64Array(N_PTS), TY = new Float64Array(N_PTS);
export const G = { Q: 1, A: 0, L: 0, v: 0, dA: 0, R: 0, ok: 0, n: 0 };   // R = mean radius about the centroid

// One trace of c's equipotential. Fills X/Y; returns 1 when every point stayed finite.
export function trace(cr, ci) {
  const R0 = Math.pow(R_T, 1 << DEPTH);
  for (let j = 0; j < N_PTS; j++) {
    const a = 2 * Math.PI * j / N_PTS;
    X[j] = R0 * Math.cos(a);
    Y[j] = R0 * Math.sin(a);
  }
  for (let m = 0; m < DEPTH; m++) {
    let pr = 1, pi = 0;   // the previous point on this level, for the branch
    for (let j = 0; j < N_PTS; j++) {
      const k = (2 * j) % N_PTS, wr = X[k] - cr, wi = Y[k] - ci;
      // principal sqrt of w
      const mod = Math.sqrt(wr * wr + wi * wi), sr = Math.sqrt(Math.max(0, (mod + wr) / 2));
      let si = Math.sqrt(Math.max(0, (mod - wr) / 2));
      if (wi < 0) si = -si;
      // the branch continuous with the previous point (j = 0: the one on the positive side, external angle 0)
      const dp = (sr - pr) * (sr - pr) + (si - pi) * (si - pi), dm = (sr + pr) * (sr + pr) + (si + pi) * (si + pi);
      const s = j === 0 ? (sr >= 0 ? 1 : -1) : (dp <= dm ? 1 : -1);
      TX[j] = s * sr;
      TY[j] = s * si;
      pr = TX[j];
      pi = TY[j];
    }
    X.set(TX);
    Y.set(TY);
  }
  let ok = 1;
  for (let j = 0; j < N_PTS; j++) if (!isFinite(X[j]) || !isFinite(Y[j])) ok = 0;
  return ok;
}

// Green's theorem on the polygon: A = 1/2 Σ (x_j y_{j+1} − x_{j+1} y_j), L = Σ |z_{j+1} − z_j|, Q = 4πA/L²,
// dA/dt and the mean boundary speed against the previous frame's curve (same external angles → the same material points).
export function measure(cr, ci, dt) {
  const ok = trace(cr, ci);
  G.ok = ok;
  if (!ok) return G;
  let A = 0, L = 0, cx = 0, cy = 0;
  for (let j = 0; j < N_PTS; j++) {
    const k = (j + 1) % N_PTS;
    A += X[j] * Y[k] - X[k] * Y[j];
    L += Math.hypot(X[k] - X[j], Y[k] - Y[j]);
    cx += X[j];
    cy += Y[j];
  }
  A = Math.abs(A) / 2;
  cx /= N_PTS;
  cy /= N_PTS;
  let R = 0;
  for (let j = 0; j < N_PTS; j++) R += Math.hypot(X[j] - cx, Y[j] - cy);
  R /= N_PTS;
  let v = 0;
  if (G.n > 0 && dt > 0) {
    for (let j = 0; j < N_PTS; j++) v += Math.hypot(X[j] - X0[j], Y[j] - Y0[j]);
    v /= N_PTS * dt;
    G.dA = (A - G.A) / dt;
  }
  X0.set(X);
  Y0.set(Y);
  G.A = A;
  G.L = L;
  G.Q = L > 0 ? 4 * Math.PI * A / (L * L) : 0;
  G.R = R;
  G.v = v;
  G.n++;
  return G;
}

export function resetGreen() {
  G.Q = 1; G.A = G.L = G.v = G.dA = G.R = 0; G.ok = 0; G.n = 0;
}
export const curve = () => ({ x: X, y: Y });
