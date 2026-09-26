// MAXWELL — the display pass: one fragment program that turns the field into the picture.
import { ABSN } from './fdtd.js';
//
// Signed Ez is the HUE: positive toward the key's anchor hue (assets/math/keycolour.js, the circle of fifths), negative
// toward the hue half a turn away, continuously through zero — so a standing wave reads as two interleaved colours and
// a travelling front as a moving colour edge. |E| (with a share of |H|, which is what carries the energy in the front)
// is the LUMINANCE, through the core's linear chain with bloom on. The twelve charges glow in their twelve hues; the
// medium is drawn as a faint hint so the lens, the cavity walls, the lattice and the rails are visible.
//
// The grid is 16:9 and is CONTAINED in the viewport (letterbox in portrait, pillarbox in a wider window): the charges'
// ring lives inside the central square, so it is never cropped whatever the phone does (v0.6 mobile).
//
// The field target is NEAREST (the two kernels use texelFetch, which ignores the filter), so the display does its own
// bilinear fetch — FEIGEN's colour pass does the same thing for the same reason (DECISIONS §16).
export const GLOWW = 5.5;     // a charge's glow radius in cells
export const MEDE = 0.10;     // how brightly a unit of eps contrast is drawn
export const MEDC = 0.26;     // ... and the conductor (0.55 read as a bright ring that outshone the field)
export const HGAIN = 0.35;    // how much of |H| joins |E| in the luminance (E and H alternate in a standing wave,
                              // so too much of it fills the nodes in and the standing pattern stops reading)
export const EPS0 = 0.015;    // the sign of Ez is read as ez / (|ez| + EPS0): a soft sign, so the two hues are the
                              // two hues and only the zero crossing is a blend. A plain multiply-and-clamp put the
                              // whole plane at one hue, because |Ez| away from a source is a few hundredths.
export const LSAT = 0.92;

export const FS_SHOW = `
uniform sampler2D uF;
uniform sampler2D uM;
uniform vec2 uSz;         // the grid in cells
uniform vec2 uCtr;        // its centre in cells
uniform vec4 uView;       // the cells one screen height covers, the yaw, the zoom, the screen aspect
uniform vec4 uCol;        // the anchor hue, saturation, brightness, and the medium's hue
uniform vec4 uGain;       // the field gain, the medium visibility, the glow gain, the floor
uniform float uGX[12];
uniform float uGY[12];
uniform float uGA[12];
uniform float uGH[12];
uniform vec2 uRing;        // the charges' ring: its radius in cells and how far the glows reach
vec3 hueRGB(float h, float sat, float bri) {
  vec3 c = 0.5 + 0.5 * cos(TAU * (h + vec3(0.0, 0.33, 0.67)));
  float l = dot(c, vec3(0.3, 0.59, 0.11));
  return mix(vec3(l), c, sat) * bri;
}
vec4 fetchB(vec2 p) {      // manual bilinear: texel centres sit at i + 0.5
  vec2 q = p - 0.5, fl = floor(q), f = q - fl;
  ivec2 b = ivec2(fl), hi = ivec2(uSz) - 1;
  vec4 a = texelFetch(uF, clamp(b, ivec2(0), hi), 0);
  vec4 c = texelFetch(uF, clamp(b + ivec2(1, 0), ivec2(0), hi), 0);
  vec4 d = texelFetch(uF, clamp(b + ivec2(0, 1), ivec2(0), hi), 0);
  vec4 e = texelFetch(uF, clamp(b + ivec2(1, 1), ivec2(0), hi), 0);
  return mix(mix(a, c, f.x), mix(d, e, f.x), f.y);
}
void main() {
  vec2 s = (vUv - 0.5) * vec2(uView.w, 1.0);
  s = rot(-uView.y) * s / uView.z;
  vec2 g = uCtr + s * uView.x;
  if (g.x < 0.0 || g.y < 0.0 || g.x > uSz.x || g.y > uSz.y) { o = vec4(0.0, 0.0, 0.0, 1.0); return; }
  vec4 f = fetchB(g);
  vec4 md = texelFetch(uM, clamp(ivec2(g), ivec2(0), ivec2(uSz) - 1), 0);
  float ez = f.r;
  float hm = length(f.gb);
  float sgn = ez / (abs(ez) + ${EPS0.toFixed(4)});
  float hue = uCol.x + 0.25 * (1.0 - sgn);
  float L = uGain.x * (abs(ez) + ${HGAIN.toFixed(2)} * hm);
  L = L / (1.0 + L);
  // The picture is a round PORTHOLE: the plane fades to black over the absorber's own width, on a DISC of radius
  // half the grid height. A rectangular fade would have the camera's full turn sweep four black corners across the
  // frame (the drop montage at yaw 5.9 was a straight black cut through the middle of the standing wave).
  float R = 0.5 * uSz.y;
  float ed = 1.0 - smoothstep(R - ${(2.2 * ABSN).toFixed(1)}, R - ${(0.2 * ABSN).toFixed(1)}, length(g - uCtr));
  vec3 col = hueRGB(hue, ${LSAT.toFixed(2)} * uCol.y, uCol.z) * L;
  // the medium, as a hint: the lens brightens with its eps contrast, a conductor draws as a cool line
  col += uGain.y * (${MEDE.toFixed(3)} * max(0.0, md.r - 1.0) + ${MEDC.toFixed(3)} * md.b) * hueRGB(uCol.w, 0.5, 1.0);
  // the twelve charges, each in its own hue on the circle of fifths. They sit on one ring, so one radius test
  // skips the loop for most of the screen (the same trick the source pass uses).
  if (abs(length(g - uCtr) - uRing.x) < uRing.y) {
    for (int k = 0; k < 12; k++) {
      vec2 d = g - vec2(uGX[k], uGY[k]);
      float q = dot(d, d);
      if (q > ${(GLOWW * GLOWW * 9).toFixed(1)}) continue;
      col += hueRGB(uGH[k], uCol.y, 1.0) * (uGain.z * uGA[k] * exp(-q / ${(2 * GLOWW * GLOWW).toFixed(2)}));
    }
  }
  o = vec4((col + uGain.w * hueRGB(uCol.x, 0.3, 1.0)) * ed, 1.0);
}
`;

// The downsample pass for the H field lines. Ez is a plain block mean (only hooks.probe() reads it), but H is
// restricted FLUX-CONSERVINGLY. Hx lives on the vertical faces of a cell and Hy on the horizontal ones, so the
// coarse Hx of an n x n block is the mean of the n fine Hx DOWN its left face and the coarse Hy the mean of the n
// fine Hy ALONG its bottom face. Then the coarse divergence of a block is exactly (1/n) times the sum of the fine
// divergences inside it — zero — and only then is the stream function of the lines below path-independent. A plain
// block mean of everything is not flux-conserving, and neither is the same average taken along the wrong axis: both
// left a branch in the integral that drew a bundle of parallel lines running off the edge of the frame.
export const FS_DOWN = `
uniform sampler2D uF;
uniform vec2 uSz;
uniform float uBlk;       // the block size in cells
void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  ivec2 hi = ivec2(uSz) - 1;
  int n = int(uBlk);
  float ez = 0.0, hx = 0.0, hy = 0.0;
  for (int i = 0; i < 16; i++) {
    if (i >= n) break;
    for (int j = 0; j < 16; j++) {
      if (j >= n) break;
      ez += texelFetch(uF, clamp(ivec2(p.x * n + i, p.y * n + j), ivec2(0), hi), 0).r;
    }
    hx += texelFetch(uF, clamp(ivec2(p.x * n, p.y * n + i), ivec2(0), hi), 0).g;
    hy += texelFetch(uF, clamp(ivec2(p.x * n + i, p.y * n), ivec2(0), hi), 0).b;
  }
  o = vec4(ez / float(n * n), hx / float(n), hy / float(n), 0.0);
}
`;

// ------------------------------------------------------------------------------------------------------------------
// The H field lines, path A of ctx.lines (CONTRACTS §1.12).
//
// Path A, not path B: a field line is a sequential construction, and path B's vertex shader would have to rebuild the
// whole curve for every one of its points. The CPU builds the segments once and uploads them.
//
// In two dimensions a divergence-free field is the curl of ONE scalar: H = (dA/dy, -dA/dx). Its field lines are
// therefore the LEVEL SETS of A — and a level set of a scalar is a closed curve or a curve that leaves the window,
// which is the whole geometric content of "there are no magnetic monopoles". A is recovered from the readback by
// cumulative sums: the path integral of H is path-independent EXACTLY because div H = 0 (test_fdtd gate 1).
//
// The lines are then the CONTOURS of A at evenly spaced levels, by marching squares — not streamlines walked by an
// integrator. Two reasons, both paid for on the montage: (1) evenly spaced levels means equal flux between
// neighbouring lines, so the line DENSITY is |H| and the picture is the physics, where seeded streamlines draw
// wherever the seeds happened to fall; (2) an integrator drifts off its level set and wanders the far field, where
// |H| is rounding — the first montages were scribbles across the frame, and an arc-length step plus a Newton
// projection back onto the level set only halved it. Marching squares cannot drift: every point is an interpolation
// on a cell edge.
//
// CLOSURE, measured: the crossing on the edge between two cells is the same linear interpolation of the same two
// corner values from both sides, so the two cells' endpoints are the same float. chains() hashes every endpoint and
// walks the pairing; hooks.probe() reports `loops` (closed contours), `open` (contours with a loose end — only ones
// that leave the window) and `gap`, the largest distance from a closed contour's end back to its start, which is 0.
export const NLEV = [9, 11, 13, 15];    // contour levels of A per tier — geometry, so the table stays in the scene
export const HW = 1.3;                  // the strokes' width in px at 720p
export const HALPHA = 0.30;             // ... and their brightness (alpha is coverage, brightness is the colour: §1.12)
export const AFLOOR = 1e-6;             // a flat A (no field at all) draws nothing

// The stream function on the small grid: A[i][j] - A[i][j-1] = Hx[i][j-1] and A[i][j] - A[i-1][j] = -Hy[i-1][j].
// One sweep down the first column and then along each row.
//
// Then the best-fit PLANE of A is removed. A plane in A is a CONSTANT H over the window, and the one sweep
// manufactures one: block-averaging the field leaves a small residual divergence, the integral is then very slightly
// path-dependent, and 60-odd recursion steps accumulate it into a ramp the size of the field itself. Without this the
// contours came out as a bundle of parallel straight lines running off the bottom of the frame. On a regular grid the
// centred coordinates are orthogonal and zero-mean, so the fit is three sums.
export function stream(px, w, h, A) {
  A[0] = 0;
  for (let j = 1; j < h; j++) A[j * w] = A[(j - 1) * w] + px[4 * ((j - 1) * w) + 1];
  for (let j = 0; j < h; j++) {
    for (let i = 1; i < w; i++) A[j * w + i] = A[j * w + i - 1] - px[4 * (j * w + i - 1) + 2];
  }
  const cx = (w - 1) / 2, cy = (h - 1) / 2;
  let s0 = 0, sx = 0, sy = 0, qx = 0, qy = 0;
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const v = A[j * w + i], X = i - cx, Y = j - cy;
      s0 += v;
      sx += v * X;
      sy += v * Y;
      qx += X * X;
      qy += Y * Y;
    }
  }
  const a0 = s0 / (w * h), bx = qx > 0 ? sx / qx : 0, by = qy > 0 ? sy / qy : 0;
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) A[j * w + i] -= a0 + bx * (i - cx) + by * (j - cy);
  }
  return A;
}

// Marching squares over A at `nl` evenly spaced levels. Writes x0, y0, x1, y1 per segment (small-grid coordinates)
// into `out` and returns the segment count. Per cell only the levels between its own min and max corner are tried.
export function contours(A, w, h, nl, out, cap) {
  let lo = A[0], hi = A[0];
  for (let p = 1; p < w * h; p++) { const v = A[p]; if (v < lo) lo = v; else if (v > hi) hi = v; }
  if (!(hi - lo > AFLOOR)) return 0;
  const dA = (hi - lo) / nl;
  let n = 0;
  const put = (x0, y0, x1, y1) => { out[4 * n] = x0; out[4 * n + 1] = y0; out[4 * n + 2] = x1; out[4 * n + 3] = y1; n++; };
  for (let j = 0; j + 1 < h; j++) {
    for (let i = 0; i + 1 < w; i++) {
      const a = A[j * w + i], b = A[j * w + i + 1], c = A[(j + 1) * w + i + 1], d = A[(j + 1) * w + i];
      const cl = Math.min(a, b, c, d), ch = Math.max(a, b, c, d);
      const k0 = Math.max(0, Math.ceil((cl - lo) / dA - 0.5)), k1 = Math.min(nl - 1, Math.floor((ch - lo) / dA - 0.5));
      for (let k = k0; k <= k1; k++) {
        if (n + 2 > cap) return n;
        const L = lo + (k + 0.5) * dA;
        const m = (a > L ? 1 : 0) | (b > L ? 2 : 0) | (c > L ? 4 : 0) | (d > L ? 8 : 0);
        if (m === 0 || m === 15) continue;
        // the four edge crossings, each the same interpolation from either side of that edge
        const eb = i + (L - a) / (b - a), er = j + (L - b) / (c - b), et = i + (L - d) / (c - d), el = j + (L - a) / (d - a);
        switch (m) {
          case 1: case 14: put(eb, j, i, el); break;
          case 2: case 13: put(eb, j, i + 1, er); break;
          case 3: case 12: put(i, el, i + 1, er); break;
          case 4: case 11: put(i + 1, er, et, j + 1); break;
          case 6: case 9: put(eb, j, et, j + 1); break;
          case 7: case 8: put(i, el, et, j + 1); break;
          case 5: put(eb, j, i, el); put(i + 1, er, et, j + 1); break;
          case 10: put(eb, j, i + 1, er); put(i, el, et, j + 1); break;
          default: break;
        }
      }
    }
  }
  return n;
}

// Walk the pairing of segment endpoints: how many contours close, how many have a loose end, and the largest distance
// from a closed contour's last point back to its first (0 — the two cells either side of an edge compute the same float).
export function chains(seg, n) {
  const at = new Map(), seen = new Uint8Array(n);
  const key = (x, y) => x + ',' + y;
  for (let s = 0; s < n; s++) {
    for (let e = 0; e < 2; e++) {
      const k = key(seg[4 * s + 2 * e], seg[4 * s + 2 * e + 1]);
      const l = at.get(k);
      if (l) l.push(s); else at.set(k, [s]);
    }
  }
  let loops = 0, open = 0, gap = 0;
  for (let s0 = 0; s0 < n; s0++) {
    if (seen[s0]) continue;
    const x0 = seg[4 * s0], y0 = seg[4 * s0 + 1];
    let x = seg[4 * s0 + 2], y = seg[4 * s0 + 3], closed = false;
    seen[s0] = 1;
    for (let step = 0; step < n; step++) {
      if (x === x0 && y === y0) { closed = true; break; }
      const l = at.get(key(x, y));
      let nx = -1;
      if (l) for (const t of l) if (!seen[t]) { nx = t; break; }
      if (nx < 0) break;
      seen[nx] = 1;
      const sameStart = seg[4 * nx] === x && seg[4 * nx + 1] === y;
      x = sameStart ? seg[4 * nx + 2] : seg[4 * nx];
      y = sameStart ? seg[4 * nx + 3] : seg[4 * nx + 1];
    }
    if (closed) { loops++; gap = Math.max(gap, Math.hypot(x - x0, y - y0)); } else open++;
  }
  return { loops, open, gap };
}
