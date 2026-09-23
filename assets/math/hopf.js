// The Hopf fibration, pure and node-importable.
//   S³ ⊂ C²  ∋ (z1, z2), |z1|²+|z2|² = 1.   Hopf map h(z1,z2) = (2 z1 z̄2, |z1|²−|z2|²) ∈ S².
//   The fibre over the base point (θ, φ) (colatitude θ ∈ [0,π], longitude φ) is the circle
//       ψ ↦ e^{iψ} (cos(θ/2) e^{iφ/2}, sin(θ/2) e^{−iφ/2}).
//   Stereographic projection from the pole (0,0,0,1) sends every fibre to a circle in R³ and the fibres over a
//   latitude circle θ = const onto a torus of revolution about the x3 axis with major radius R = 1/cos(θ/2) and tube
//   radius r = tan(θ/2) (θ = π/2 is the Clifford torus, R = √2, r = 1); each fibre is a Villarceau circle of it.
//   The Hopf flow (z1,z2) ↦ e^{iψ}(z1,z2) slides every fibre along itself in lockstep (the "breathing").
//   A second rotation, in SU(2) but not in the Hopf U(1): (z1,z2) ↦ (z1 cos α − z2 sin α, z1 sin α + z2 cos α) maps
//   fibres to fibres (it rotates the base S² about the x axis), so the whole torus family tumbles rigidly on S³.
//   A pole offset δ (rotation in the (Im z1, Im z2) plane before projecting) moves the projection pole toward the
//   picture: the family pinches toward it.

// S³ point of the fibre over (theta, phi) at fibre parameter psi. out = [x1, y1, x2, y2] (z1 = x1+iy1, z2 = x2+iy2).
export function fibre4(theta, phi, psi, out = [0, 0, 0, 0]) {
  const c = Math.cos(theta / 2), s = Math.sin(theta / 2);
  const a1 = psi + phi / 2, a2 = psi - phi / 2;
  out[0] = c * Math.cos(a1);
  out[1] = c * Math.sin(a1);
  out[2] = s * Math.cos(a2);
  out[3] = s * Math.sin(a2);
  return out;
}

// Hopf map S³ → S² (unit vector).
export function hopfMap(z, out = [0, 0, 0]) {
  const [x1, y1, x2, y2] = z;
  // 2 z1 z̄2 = 2 (x1 + i y1)(x2 − i y2)
  out[0] = 2 * (x1 * x2 + y1 * y2);
  out[1] = 2 * (y1 * x2 - x1 * y2);
  out[2] = x1 * x1 + y1 * y1 - x2 * x2 - y2 * y2;
  return out;
}

// The Hopf flow: multiply both complex coordinates by e^{iψ}. In place.
export function hopfFlow(z, psi) {
  const c = Math.cos(psi), s = Math.sin(psi);
  const x1 = z[0], y1 = z[1], x2 = z[2], y2 = z[3];
  z[0] = x1 * c - y1 * s;
  z[1] = x1 * s + y1 * c;
  z[2] = x2 * c - y2 * s;
  z[3] = x2 * s + y2 * c;
  return z;
}

// The tumble: a real rotation mixing z1 and z2 (in SU(2), commutes with the Hopf flow, not in the Hopf U(1)). In place.
export function rotSU2(z, alpha) {
  const c = Math.cos(alpha), s = Math.sin(alpha);
  const x1 = z[0], y1 = z[1], x2 = z[2], y2 = z[3];
  z[0] = x1 * c - x2 * s;
  z[1] = y1 * c - y2 * s;
  z[2] = x1 * s + x2 * c;
  z[3] = y1 * s + y2 * c;
  return z;
}

// Pole offset: rotate the (y1, y2) plane by delta so the projection pole (0,0,0,1) moves toward the core circle. In place.
export function poleOffset(z, delta) {
  const c = Math.cos(delta), s = Math.sin(delta);
  const y1 = z[1], y2 = z[3];
  z[1] = y1 * c - y2 * s;
  z[3] = y1 * s + y2 * c;
  return z;
}

// Stereographic projection from (0,0,0,1): (x1, y1, x2) / (1 − y2). Points at the pole go to infinity (clamped).
export function stereo(z, out = [0, 0, 0]) {
  const d = 1 - z[3], k = 1 / Math.max(d, 1e-6);
  out[0] = z[0] * k;
  out[1] = z[1] * k;
  out[2] = z[2] * k;
  return out;
}

// Torus of revolution (axis x3) carrying the fibres over the latitude theta: major radius R, tube radius r.
export function torusRadii(theta) {
  const c = Math.cos(theta / 2);
  return { R: 1 / c, r: Math.tan(theta / 2) };
}

// Signed distance of a point in R³ from the torus surface (axis x3) with radii R, r.
export function torusDist(p, R, r) {
  const rho = Math.hypot(p[0], p[1]);
  return Math.hypot(rho - R, p[2]) - r;
}

// One projected fibre point: (theta, phi, psi) → R³, after the Hopf flow psi0, the tumble alpha and the pole offset delta.
export function fibre(theta, phi, psi, psi0 = 0, alpha = 0, delta = 0, out = [0, 0, 0]) {
  const z = fibre4(theta, phi, psi + psi0);
  if (alpha) rotSU2(z, alpha);
  if (delta) poleOffset(z, delta);
  return stereo(z, out);
}

// The (p, q) torus knot on the torus of latitude theta: u = p t on the z1 circle, v = q t on the z2 circle, t ∈ [0, 2π).
// (1, 1) is a Hopf fibre; (p, q) with p/q the rotation number of NAV's bulb ties the knot to the same interval.
export function knot4(theta, p, q, t, out = [0, 0, 0, 0]) {
  const c = Math.cos(theta / 2), s = Math.sin(theta / 2);
  out[0] = c * Math.cos(p * t);
  out[1] = c * Math.sin(p * t);
  out[2] = s * Math.cos(q * t);
  out[3] = s * Math.sin(q * t);
  return out;
}

export function knot(theta, p, q, t, psi0 = 0, alpha = 0, delta = 0, out = [0, 0, 0]) {
  const z = knot4(theta, p, q, t);
  if (psi0) hopfFlow(z, psi0);
  if (alpha) rotSU2(z, alpha);
  if (delta) poleOffset(z, delta);
  return stereo(z, out);
}

// Circle through three points in R³: centre, radius, unit normal (circumcentre by a 2×2 solve in the triangle's plane).
// Used by the tests (and by nothing at runtime).
export function circleOf3(a, b, c) {
  const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const dot = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
  const m11 = dot(e1, e1), m12 = dot(e1, e2), m22 = dot(e2, e2);
  // 2(α m11 + β m12) = m11 ; 2(α m12 + β m22) = m22
  const det = m11 * m22 - m12 * m12;
  const al = (m11 * m22 - m22 * m12) / (2 * det), be = (m11 * m22 - m11 * m12) / (2 * det);
  const ctr = [0, 1, 2].map((i) => a[i] + al * e1[i] + be * e2[i]);
  const n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
  const nl = Math.hypot(n[0], n[1], n[2]);
  return { centre: ctr, radius: Math.hypot(ctr[0] - a[0], ctr[1] - a[1], ctr[2] - a[2]), normal: [n[0] / nl, n[1] / nl, n[2] / nl] };
}
