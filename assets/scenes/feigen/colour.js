// FEIGEN's COLOUR pass (v0.2 §16) — the music, every frame, one texture read of the field plus a few of spec/hist.
//
// The camera of the frame maps each pixel to a point of parameter space exactly as the §15 shader did
// (p = (gl_FragCoord.xy - .5*uRes)/uRes.y, dc = centre + (p * rot) * width), and the field pass' answer at that
// point is fetched out of the current rung. Everything after that is the §15 colouring verbatim: the same palette,
// the same gains, the same specM / histM (so the `&histfull=1` equality still holds).
//
// Two details that are not in the §15 shader:
//  · the fetch is a MANUAL bilinear of four texelFetch()es, because two of the four channels must not be blended
//    linearly — the escape angle wraps (blended as a unit vector) and the interior/exterior sign must not be
//    interpolated at all (where the four signs disagree the nearest texel is taken alone).
//  · each of the four texels is DECODED FIRST and the decoded quantities are what get blended. log d and log2 G are
//    continuous functions of c; the raw n and log|z'| are not (both jump by a doubling across an escape-count
//    contour, and only their combination is continuous), so interpolating the raw channels would draw a seam along
//    every contour. Same arithmetic, one order later.
//
// A second rung can be sampled at the same time with its own rectangle and its own camera (uField2 / uRect2 /
// uCentre2 / uWidth2) and cross-faded IN FIELD SPACE by uBlend: a rung change and the arrival of a rung that was
// standing in are both resolution fades of the same mathematics, never two coloured pictures ghosting over another.
export const FS_COLOUR = `
uniform sampler2D uField;
uniform sampler2D uField2;
uniform sampler2D uSpec;
uniform sampler2D uHist;
uniform vec4 uRect;
uniform vec4 uRect2;
uniform vec2 uSz;
uniform vec2 uSz2;
uniform vec2 uCentre;
uniform vec2 uCentre2;
uniform float uWidth;
uniform float uWidth2;
uniform float uBlend;
uniform float uRot;
uniform float uHistRow;
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

// one field texel -> (log d, log2 G, escape angle, interior trap). lw = log of the view width this pixel is measured
// against, so d is dimensionless and the dive stays scale-free exactly as in §15.
vec4 dec(vec4 f, float lw){
  float l2 = log2(max(f.y, 1e-6));
  return vec4(f.y + l2 * 0.69314718 - f.z - lw, l2 - f.x, f.w, max(-f.x - 1., 0.));
}

void sampleF(sampler2D T, vec4 R, vec2 SZ, vec2 dc, float lw, out vec4 v, out float esc){
  float fx = clamp((dc.x - R.x) / (R.y - R.x) * SZ.x - 0.5, 0., SZ.x - 1.);
  float fy = clamp(abs(dc.y) / R.z * SZ.y - 0.5, 0., SZ.y - 1.);   // |y|: the field is the upper half-plane only
  ivec2 i0 = ivec2(floor(fx), floor(fy));
  ivec2 i1 = min(i0 + ivec2(1), ivec2(SZ) - ivec2(1));
  vec2 fr = vec2(fx, fy) - vec2(i0);
  vec4 a = texelFetch(T, i0, 0);
  vec4 b = texelFetch(T, ivec2(i1.x, i0.y), 0);
  vec4 c = texelFetch(T, ivec2(i0.x, i1.y), 0);
  vec4 d = texelFetch(T, i1, 0);
  float sa = step(0., a.x), sb = step(0., b.x), sc = step(0., c.x), sd = step(0., d.x);
  if (sa != sb || sa != sc || sa != sd) {          // a boundary texel: interior and exterior do not average
    vec4 nr = fr.x < 0.5 ? (fr.y < 0.5 ? a : c) : (fr.y < 0.5 ? b : d);
    esc = step(0., nr.x);
    v = dec(nr, lw);
    return;
  }
  esc = sa;
  vec4 A = dec(a, lw), B = dec(b, lw), C = dec(c, lw), D = dec(d, lw);
  float w0 = (1. - fr.x) * (1. - fr.y), w1 = fr.x * (1. - fr.y), w2 = (1. - fr.x) * fr.y, w3 = fr.x * fr.y;
  v = w0 * A + w1 * B + w2 * C + w3 * D;
  float ss = w0 * sin(TAU * A.z) + w1 * sin(TAU * B.z) + w2 * sin(TAU * C.z) + w3 * sin(TAU * D.z);
  float cc = w0 * cos(TAU * A.z) + w1 * cos(TAU * B.z) + w2 * cos(TAU * C.z) + w3 * cos(TAU * D.z);
  v.z = fract(atan(ss, cc) / TAU + 1.);            // the angle wraps: blend it as a unit vector, not as a number
}

void main(){
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  mat2 M = rot(uRot);
  vec2 dc = uCentre + (p * M) * uWidth;
  vec4 v; float esc;
  sampleF(uField, uRect, uSz, dc, log(uWidth), v, esc);
  if (uBlend > 0.) {
    vec4 v2; float e2;
    sampleF(uField2, uRect2, uSz2, uCentre2 + (p * M) * uWidth2, log(uWidth2), v2, e2);
    if (e2 == esc) {
      float ss = mix(sin(TAU * v.z), sin(TAU * v2.z), uBlend), cc = mix(cos(TAU * v.z), cos(TAU * v2.z), uBlend);
      v = mix(v, v2, uBlend);
      v.z = fract(atan(ss, cc) / TAU + 1.);
    } else if (uBlend > 0.5) { v = v2; esc = e2; }
  }
  vec3 col;
  if (esc > 0.5) {
    // distance to M in units of the view width: scale-free, so the dive can loop on the cascade's self-similarity
    float d = exp(v.x), lG = v.y, ea = v.z;
    float sp = specM(abs(fract(ea) * 2. - 1.) * 0.9);
    float fil = exp(-d * mix(160., 70., uBands.x)) + 0.004 / (d + 0.0025);
    col = palM(0.2 + sp * 0.3 + d * 0.8) * fil * (0.45 + 1.3 * uLevel + 1.1 * uKick + 2. * uDrop);
    // Green's-function level sets: one band per doubling of G, drifting on musical time
    float band = 1. - smoothstep(0., 0.1, abs(fract(lG * 0.5 - uFlow * 0.3) - 0.5) - 0.4);
    col += palM(0.65 + 0.04 * lG) * band * (0.04 + 0.45 * sp * sp + 0.3 * uHat) * exp(-d * 2.5) * (0.4 + uLevel);
    // the spectrogram's past drifts off the boundary: the further out, the older the row
    col += palM(0.85) * histM(abs(fract(ea * 2.) * 2. - 1.), clamp(d * 1.5, 0., 0.9)) * exp(-d * 6.) * 0.35 * uMidS;
  } else {
    float t = v.w;   // orbit trap inside the set: how near the orbit passed the origin
    col = palM(0.5 + t * 0.6) * (0.03 + 0.22 * uBands.x * exp(-t * 2.) + 0.12 * uTension) * (0.4 + uLevel);
  }
  o = vec4(col * uAlive, 1.);
}
`;
