// FEIGEN fragment shader, lifted from synapse's FS_FEIGEN (scene 6). HEAD (docs/CONTRACTS.md §1.2) is prepended by
// ctx.mkProg, so vUv / o / uRes / uBands / TAU / rot() / pal() already exist. The GLSL_COMMON helpers this scene uses
// are renamed (palM / specM / histM) so they never collide with HEAD's pal() / hash() / rot().
//
// A dive down the real axis of the Mandelbrot set toward c_inf = -1.401155189..., the limit of the period-doubling
// cascade, by one Feigenbaum factor delta = 4.669201609 per unit of level L. Precision comes from perturbation theory:
// the reference orbit Z_n of c_inf itself (real, bounded, never periodic) is computed in double on the CPU and lands
// here as uOrbit (R32F 512x1, NEAREST); each pixel iterates only its offset e_n, e' = 2 Z e + e^2 + dc — exact algebra,
// so float32 never runs out however deep L goes. Tricorn flip: z -> conj(z)^2 + c keeps the SAME real reference orbit
// (the real slice of the Tricorn is the real slice of M), so it is one sign change: e' = conj(2 Z e + e^2) + dc.
// Colour: distance-estimated filaments (d ~ |z| ln|z| / |z'|, parameter plane z' <- 2 z z' + 1, z'_0 = 0; for the
// antiholomorphic map the bound |z'| <- 2|z||z'| + 1 stands in), Green's-function bands (lG = log2(log r) - n), and the
// spectrogram's past drifting off the boundary. d is divided by the view width, so every term is scale-free: level L+1
// is pixel-for-pixel the same kind of picture as level L, which is what makes the loop seamless.
export const FS_FEIGEN = `
uniform sampler2D uOrbit;
uniform sampler2D uSpec;
uniform sampler2D uHist;
uniform float uHistRow;
uniform vec2 uCentre;
uniform float uWidth;
uniform float uTricorn;
uniform float uRot;
uniform int uIter;
uniform float uLevel;
uniform float uKick;
uniform float uDrop;
uniform float uHat;
uniform float uFlow;
uniform float uMidS;
uniform float uTension;
uniform float uAlive;
uniform float uHue;
uniform float uSat;
uniform float uBri;
uniform float uSpread;
uniform float uInvert;

// the engine's 256x1 log spectrum, 30 Hz .. 16 kHz, peak-normalised
float specM(float x){ return texture(uSpec, vec2(clamp(x, 0.002, 0.998), 0.5)).r; }
// the 256x128 spectrogram ring: uHistRow is "now" (the next row to be written, minus half a texel), age goes back in
// time in rows/128 (~1.3 s of past); the T wrap is REPEAT, so the subtraction needs no modulo
float histM(float x, float age){ return texture(uHist, vec2(clamp(x, 0.003, 0.997), uHistRow - clamp(age, 0., 0.96))).r; }
// LOOK.mood palette: cosine ramp about the mood hue, gamma'd, inverted on a drop, then desaturated / dimmed
vec3 palM(float t){
  vec3 c = 0.5 + 0.5 * cos(TAU * (uHue + (t - 0.5) * uSpread + vec3(0., 0.33, 0.67)));
  c = pow(c, vec3(1.7));
  c = mix(c, vec3(1.) - c, uInvert * 0.85);
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  return mix(vec3(l), c, uSat) * uBri;
}

void main(){
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  // dc is this pixel's offset in parameter space from c_inf: the whole view is uWidth wide, rotated by uRot
  vec2 dc = uCentre + (p * rot(uRot)) * uWidth;
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
  vec3 col;
  if (esc) {
    // distance to M in units of the view width: scale-free, so the dive can loop on the cascade's self-similarity
    float r = sqrt(m2), d = r * log(r) / max(length(dz), 1e-20) / uWidth;
    float lG = log2(log(r)) - n, ea = atan(z.y, z.x) / TAU + 0.5;
    float sp = specM(abs(fract(ea) * 2. - 1.) * 0.9);
    float fil = exp(-d * mix(160., 70., uBands.x)) + 0.004 / (d + 0.0025);
    col = palM(0.2 + sp * 0.3 + d * 0.8) * fil * (0.45 + 1.3 * uLevel + 1.1 * uKick + 2. * uDrop);
    // Green's-function level sets: one band per doubling of G, drifting on musical time
    float band = 1. - smoothstep(0., 0.1, abs(fract(lG * 0.5 - uFlow * 0.3) - 0.5) - 0.4);
    col += palM(0.65 + 0.04 * lG) * band * (0.04 + 0.45 * sp * sp + 0.3 * uHat) * exp(-d * 2.5) * (0.4 + uLevel);
    // the spectrogram's past drifts off the boundary: the further out, the older the row
    col += palM(0.85) * histM(abs(fract(ea * 2.) * 2. - 1.), clamp(d * 1.5, 0., 0.9)) * exp(-d * 6.) * 0.35 * uMidS;
  } else {
    float t = sqrt(tr);   // orbit trap inside the set: how near the orbit passed the origin
    col = palM(0.5 + t * 0.6) * (0.03 + 0.22 * uBands.x * exp(-t * 2.) + 0.12 * uTension) * (0.4 + uLevel);
  }
  o = vec4(col * uAlive, 1.);
}
`;
