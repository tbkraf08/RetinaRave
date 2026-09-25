// The four regular convex 4-polytopes as tilings of S^3: vertex coordinates → unit vertices → edges as
// nearest-neighbour pairs; a general SO(4) double rotation; edges subdivided ON the sphere and projected
// stereographically from the pole (0,0,0,1), which turns every great-circle arc into a circular arc in R^3.
// Pure JS (no GL, no DOM, node-importable). Counts: tess 16/32 · c24 24/96 · c600 120/720 · c120 600/1200.

const PHI = (1 + Math.sqrt(5)) / 2;
const IP = 1 / PHI;
const S5 = Math.sqrt(5);
const IP2 = IP * IP;
const PHI2 = PHI * PHI;

// Every sign combination of a 4-vector. Zero coordinates produce duplicates; mk4's dedup removes them.
export function signs(v) {
  const out = [];
  for (let m = 0; m < 16; m++) {
    out.push([m & 1 ? -v[0] : v[0], m & 2 ? -v[1] : v[1], m & 4 ? -v[2] : v[2], m & 8 ? -v[3] : v[3]]);
  }
  return out;
}

// All permutations of v. evenOnly keeps the even ones (parity = sum of the pick indices, as synapse counted it).
export function perms(v, evenOnly) {
  const out = [];
  const rec = (a, rest, par) => {
    if (!rest.length) {
      if (!evenOnly || par % 2 === 0) out.push(a);
      return;
    }
    rest.forEach((x, i) => rec([...a, x], rest.filter((_, j) => j !== i), par + i));
  };
  rec([], v, 0);
  return out;
}

// Normalise onto S^3, drop duplicates, then find the edges: the shortest vertex-vertex distance is the edge
// length of a regular polytope, so every pair within 2% of it is an edge.
export function mk4(list) {
  const seen = new Set();
  const V = [];
  for (const v of list) {
    const l = Math.hypot(v[0], v[1], v[2], v[3]);
    const u = [v[0] / l, v[1] / l, v[2] / l, v[3] / l];
    const k = u.map((c) => Math.round(c * 1e4)).join(',');
    if (seen.has(k)) continue;
    seen.add(k);
    V.push(u);
  }
  const N = V.length;
  const d2 = (a, b) => {
    let s = 0;
    for (let k = 0; k < 4; k++) s += (V[a][k] - V[b][k]) ** 2;
    return s;
  };
  let dm = 9;
  for (let j = 1; j < N; j++) dm = Math.min(dm, d2(0, j));
  const E = [];
  for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) if (d2(i, j) < dm * 1.02) E.push(i, j);
  return { V: new Float64Array(V.flat()), E: new Uint16Array(E), R: new Float64Array(N * 4), N, nE: E.length / 2 };
}

const DEF = {
  tess: () => signs([1, 1, 1, 1]),
  c24: () => perms([1, 1, 0, 0]).flatMap(signs),
  c600: () => [
    ...perms([1, 0, 0, 0]).flatMap(signs),
    ...signs([0.5, 0.5, 0.5, 0.5]),
    ...perms([PHI / 2, 0.5, IP / 2, 0], true).flatMap(signs),
  ],
  c120: () => [
    ...perms([0, 0, 2, 2]).flatMap(signs),
    ...perms([1, 1, 1, S5]).flatMap(signs),
    ...perms([IP2, PHI, PHI, PHI]).flatMap(signs),
    ...perms([IP, IP, IP, PHI2]).flatMap(signs),
    ...perms([0, IP2, 1, PHI2], true).flatMap(signs),
    ...perms([0, IP, PHI, S5], true).flatMap(signs),
    ...perms([IP, 1, PHI, 2], true).flatMap(signs),
  ],
};

const P4 = {};

// Cached table for a kind ('tess' | 'c24' | 'c600' | 'c120').
export const get4 = (k) => P4[k] || (P4[k] = mk4(DEF[k]()));

// A general element of SO(4): the xy and zw planes turn by independent angles (the double rotation), then a
// third turn in the xw plane. Because the two invariant planes turn at different rates the motion is never a
// simple 3-D spin: cells sweep through the projection pole and the picture turns itself inside out.
export function rotate4(P, a1, a2, a3) {
  const V = P.V;
  const R = P.R;
  const c1 = Math.cos(a1);
  const s1 = Math.sin(a1);
  const c2 = Math.cos(a2);
  const s2 = Math.sin(a2);
  const c3 = Math.cos(a3);
  const s3 = Math.sin(a3);
  for (let i = 0; i < P.N; i++) {
    const o = i * 4;
    let x = V[o];
    let y = V[o + 1];
    let z = V[o + 2];
    let q = V[o + 3];
    let t = x * c1 - y * s1;
    y = x * s1 + y * c1;
    x = t;
    t = z * c2 - q * s2;
    q = z * s2 + q * c2;
    z = t;
    t = x * c3 - q * s3;
    q = x * s3 + q * c3;
    x = t;
    R[o] = x;
    R[o + 1] = y;
    R[o + 2] = z;
    R[o + 3] = q;
  }
}

const smooth = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

// The pole gate (v0.2 §16b, DECISIONS §8's polish note). (0,0,0,1) is the point at infinity of the stereographic
// map: a sample with den = 1 − w/|v| small lands at radius g·√((2 − den)/den), so the run of pieces on an edge
// sweeping the pole reached 3.39·g — past the frame edge — and drew as a long straight streak. The gate moves
// 0.16 → 0.24 (radius at the gate 3.39·g → 2.71·g) and the ramp is re-based on the same top, so from den = 0.446
// upward the fade is exactly what it was; only the last stretch before the pole is steeper. Continuous in the
// rotation angles: f → 0 as den → GATE, so a piece still fades in and out and never appears (`cuts: 'continuous'`).
export const GATE = 0.24;
const RAMP = 1 / (0.16 + 1 / 3.5 - GATE);   // = 4.861…: (0.16 + 1/3.5) is where the old ramp reached 1

// Rotate, subdivide every edge on S^3, project, and append one 12-float line segment per piece
// (x0 y0 z0 w0 · x1 y1 z1 w1 · r g b a, widths in px). Returns the new segment count.
// o: {a1,a2,a3, sub, g, eye, fwd, wpx, col:[r,g,b], alpha}
export function emit(kind, o, segs, off, cap) {
  const P = get4(kind);
  rotate4(P, o.a1, o.a2, o.a3);
  const Rv = P.R;
  const E = P.E;
  const sub = o.sub;
  const g = o.g;
  const fx = o.fwd[0];
  const fy = o.fwd[1];
  const fz = o.fwd[2];
  const eDotF = o.eye[0] * fx + o.eye[1] * fy + o.eye[2] * fz;
  const cr = o.col[0];
  const cg = o.col[1];
  const cb = o.col[2];
  let n = off;
  for (let e = 0; e < E.length; e += 2) {
    const a = E[e] * 4;
    const b = E[e + 1] * 4;
    const ax = Rv[a];
    const ay = Rv[a + 1];
    const az = Rv[a + 2];
    const aq = Rv[a + 3];
    const dx = Rv[b] - ax;
    const dy = Rv[b + 1] - ay;
    const dz = Rv[b + 2] - az;
    const dq = Rv[b + 3] - aq;
    let pX = 0;
    let pY = 0;
    let pZ = 0;
    let pV = 0;
    let pF = 0;
    let have = false;
    for (let k = 0; k <= sub; k++) {
      const s = k / sub;
      const x = ax + dx * s;
      const y = ay + dy * s;
      const z = az + dz * s;
      const q = aq + dq * s;
      // back onto S^3: the chord's interior points are inside the sphere, and the projection of a chord is a
      // straight line — it is the renormalisation that makes the piece follow the great circle and so bend.
      const l = Math.hypot(x, y, z, q);
      const den = 1 - q / l;
      let X = 0;
      let Y = 0;
      let Z = 0;
      let vz = 0;
      let f = 0;
      if (den > GATE) {
        const m = g / (l * den);
        X = x * m;
        Y = y * m;
        Z = z * m;
        vz = X * fx + Y * fy + Z * fz - eDotF;
        f = Math.min((den - GATE) * RAMP, 1) * smooth((vz - 0.35) / 0.9);
      }
      const ok = f > 0.002;
      if (ok && have && n < cap) {
        const j = n * 12;
        segs[j] = pX;
        segs[j + 1] = pY;
        segs[j + 2] = pZ;
        segs[j + 3] = o.wpx / pV;
        segs[j + 4] = X;
        segs[j + 5] = Y;
        segs[j + 6] = Z;
        segs[j + 7] = o.wpx / vz;
        segs[j + 8] = cr;
        segs[j + 9] = cg;
        segs[j + 10] = cb;
        segs[j + 11] = o.alpha * 0.5 * (pF + f);
        n++;
      }
      pX = X;
      pY = Y;
      pZ = Z;
      pV = vz;
      pF = f;
      have = ok;
    }
  }
  return n;
}

// How close the nearest vertex comes to the projection pole, as `den` = 1 − w (the vertices are unit, so |v| = 1
// and `den` is exactly the quantity the gate tests). Reads the LAST rotate4's output, so call it after one.
// Measured on the bare xy/zw double rotation (tools/work/pole.js) this reaches 0 for the 24-, 600- and 120-cell and
// bottoms out at 0.2929 for the tesseract: a vertex sweeping through the pole is what the scene is about, and what
// GATE and its ramp exist to fade. dance.js bounds how far the dance may move it; see POLE SAFETY there.
export function poleMargin(P) {
  let m = 9;
  for (let i = 0; i < P.N; i++) { const d = 1 - P.R[i * 4 + 3]; if (d < m) m = d; }
  return m;
}

// Column-major 4x4 for clip = M·[p,1] with a pinhole camera: w = view depth, z = view depth − 2·near
// (increases with distance, and lies in (−w, w) for any point in front of the near plane — CONTRACTS §1.12).
export function mvpMat(out, eye, r, u, f, focal, aspect, near) {
  const row = [
    [(focal / aspect) * r[0], (focal / aspect) * r[1], (focal / aspect) * r[2], -(focal / aspect) * (eye[0] * r[0] + eye[1] * r[1] + eye[2] * r[2])],
    [focal * u[0], focal * u[1], focal * u[2], -focal * (eye[0] * u[0] + eye[1] * u[1] + eye[2] * u[2])],
    [f[0], f[1], f[2], -(eye[0] * f[0] + eye[1] * f[1] + eye[2] * f[2]) - 2 * near],
    [f[0], f[1], f[2], -(eye[0] * f[0] + eye[1] * f[1] + eye[2] * f[2])],
  ];
  for (let c = 0; c < 4; c++) for (let i = 0; i < 4; i++) out[c * 4 + i] = row[i][c];
  return out;
}
