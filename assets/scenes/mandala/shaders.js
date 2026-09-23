// MANDALA fragment shader. HEAD (docs/CONTRACTS.md §1.2) is prepended by ctx.mkProg, so vUv / o / uRes / uBands /
// TAU / rot() / pal() already exist here. The helpers below are the GLSL_COMMON functions this scene actually uses,
// renamed (palM / hash11 / angM / specM) so they never collide with HEAD's pal() / hash() / rot().
export const FS_MANDALA = `
uniform sampler2D uSpec;
uniform float uSeed;
uniform float uKickCount;
uniform float uFlow;
uniform float uFlowMid;
uniform float uBassS;
uniform float uMidS;
uniform float uKick;
uniform float uTension;
uniform float uDrop;
uniform float uLevel;
uniform float uHat;
uniform float uAlive;
uniform float uQuality;
uniform float uHue;
uniform float uSat;
uniform float uBri;
uniform float uSpread;
uniform float uInvert;
uniform float uAngular;

// the engine's 256x1 log spectrum, 30 Hz .. 16 kHz, peak-normalised
float specM(float x){ return texture(uSpec, vec2(clamp(x, 0.002, 0.998), 0.5)).r; }
float hash11(float p){ p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
// one visual grammar: sine bends toward triangle and then toward a stepped wave as the mood turns angular
float angM(float x){
  float s = sin(x);
  float tri = asin(s) * 0.63662;
  return mix(s, mix(tri, floor(tri * 3. + 0.5) / 3., uAngular * 0.7), uAngular);
}
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
  float r0 = length(p);
  float a0 = atan(p.y, p.x);

  // the mirror group: N in {4,6,8,10,12}, redrawn only when the section seed or the 64-kick epoch changes
  float N = 4. + 2. * floor(hash11(uSeed * 5.7 + floor(uKickCount / 64.)) * 5.);
  float seg = TAU / N;
  float a = mod(a0 + uFlowMid * 0.11, seg);
  a = abs(a - seg * 0.5);
  vec2 z = r0 * vec2(cos(a), sin(a));
  z *= 1.55 - 0.45 * uBands.x - 0.25 * uKick + 0.5 * uTension - 0.5 * uDrop;

  vec2 c = vec2(0.58 + 0.22 * sin(uFlow * 0.13) + 0.10 * uBassS,
                0.62 + 0.22 * cos(uFlow * 0.11) + 0.06 * uMidS) + 0.03 * uKick;
  float acc = 0.;
  float tr = 9.;
  int IT = 7 + int(clamp(uQuality, 0., 1.) * 3. + 0.5);
  mat2 R = rot(0.35 + 0.25 * uMidS + 0.1 * angM(uFlowMid * 0.3));
  for (int i = 0; i < 10; i++) {
    if (i >= IT) break;
    // box-fold (abs) + sphere inversion (/dot(z,z), clamped) + translate + rotate: a Kleinian-style contraction
    z = abs(z) / clamp(dot(z, z), 0.07, 3.) - c;
    z = R * z;
    float s = specM(fract(float(i) * 0.137 + 0.05));
    acc += exp(-13. * abs(length(z) - (0.35 + 0.5 * s)));   // orbit trap on a spectrum-driven radius
    tr = min(tr, abs(z.x * z.y));                            // cross trap -> the thin bright filaments
  }
  acc /= float(IT);

  vec3 col = palM(acc * 2.4 + r0 * 0.55 + uFlow * 0.02) * pow(acc * 3.2, 2.6) * (0.35 + 1.3 * uLevel);
  col += palM(0.55 + r0) * exp(-tr * 26.) * (0.12 + 1.4 * uBands.z + 0.8 * uHat);
  float sp = specM(abs(fract(a0 / TAU * N * 0.5) * 2. - 1.) * 0.9);
  col += palM(0.2 + sp) * exp(-abs(r0 - (0.3 + 0.08 * uBassS + sp * 0.2)) * mix(90., 40., uBands.x)) * (0.4 + sp * 2.);
  col += palM(0.9) * exp(-r0 * r0 * 60.) * (uKick * 0.8 + uDrop * 1.2);   // centre flare: kick + drop
  col *= 1. - smoothstep(0.2, 1.25, r0);
  o = vec4(col * uAlive, 1.);
}
`;
