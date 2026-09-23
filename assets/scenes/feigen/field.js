// FEIGEN's FIELD pass (v0.2 §16) — the mathematics, rendered once per zoom rung, a band of rows per draw.
//
// Everything the per-pixel loop produces depends on `c` alone: the escape count, |z| and |z'| at escape, the escape
// angle, the interior orbit trap. That is the *field*; the music never enters here. So it is computed once per rung
// of the zoom ladder (`ladder.js`) into an RGBA16F target covering the rung's rectangle of parameter space, and the
// colour pass samples it every frame through the current camera. The cost of the scene stops depending on depth: a
// 500-iteration rung simply takes more frames to build, and it has seconds.
//
// The iteration is the one FEIGEN shipped with in §15, unchanged: perturbation against the reference orbit Z_n of
// c_inf (uOrbit, R32F 512x1, NEAREST, computed in double on the CPU), e' = 2 Z e + e^2 + dc, and the tricorn's one
// sign flip e' = conj(2 Z e + e^2) + dc. Only the pixel's small offset is in float32, so the arithmetic never zooms.
//
// Channels (RGBA16F is enough — see docs/workers/feigen-field.md for the precision audit):
//   R = escape count n, or -(sqrt(orbit trap) + 1) when the point never escapes (the sign IS the interior test)
//   G = log |z| at escape, in (4.6, 9.3)        B = log |z'| (the parameter derivative grows like 2^n: store the log)
//   A = the escape angle in turns, [0, 1)
export const FS_FIELD = `
uniform sampler2D uOrbit;
uniform vec4 uRect;        // the rung's rectangle: x0, x1, y1 (y0 = 0; the upper half-plane only), unused
uniform vec2 uFieldSz;     // the rung target's size in texels
uniform float uTricorn;
uniform int uIter;

void main(){
  // this texel's offset from c_inf. Texel centres sit at i + 0.5, which is what the colour pass' manual bilinear
  // fetch assumes; the y axis starts at 0 because the set and the tricorn are both symmetric about the real axis.
  vec2 ij = floor(gl_FragCoord.xy);
  vec2 dc = vec2(uRect.x + (ij.x + 0.5) / uFieldSz.x * (uRect.y - uRect.x),
                 (ij.y + 0.5) / uFieldSz.y * uRect.z);
  vec2 e = vec2(0.), dz = vec2(0.), z = vec2(0.);
  int IT = uIter;
  float n = 0., m2 = 0., tr = 1e9;
  bool esc = false;
  bool tric = uTricorn > 0.5;
  for (int i = 0; i < 512; i++) {
    if (i >= IT) break;
    float Z = texelFetch(uOrbit, ivec2(i, 0), 0).r;   // the reference orbit, real: Z_n of c_inf
    z = vec2(Z + e.x, e.y);
    m2 = dot(z, z);
    if (m2 > 1e4) { esc = true; break; }
    if (i > 0) tr = min(tr, m2);
    // parameter-plane derivative for the distance estimate (the antiholomorphic map only bounds |z'|)
    dz = tric ? vec2(2. * sqrt(m2) * length(dz) + 1., 0.)
              : 2. * vec2(z.x * dz.x - z.y * dz.y, z.x * dz.y + z.y * dz.x) + vec2(1., 0.);
    vec2 t = 2. * Z * e + vec2(e.x * e.x - e.y * e.y, 2. * e.x * e.y);   // e' = 2 Z e + e^2 (+ dc)
    if (tric) t.y = -t.y;                                                // conj: the tricorn flip, one sign
    e = t + dc;
    n += 1.;
  }
  if (esc) {
    o = vec4(n, log(sqrt(m2)), log(max(length(dz), 1e-20)), atan(z.y, z.x) / TAU + 0.5);
  } else {
    o = vec4(-(sqrt(tr) + 1.), 0., 0., 0.);
  }
}
`;
