// EXPOSURE: GPU auto-exposure, lifted from synapse2's FS_LUM/FS_EXPO. Three passes, no CPU readback:
//   1) io.src -> 16x16 tile luminance (mean in .r, mean-square in .g), 4x4 subsamples per tile
//   2) 16x16 -> 1x1, folded with the previous 1x1 (ping-pong) so the exposure adapts over time
//   3) io.src * gain -> full-size out target, returned as the new chain input.
// Off by default; a scene turns it on with post.exposure.on = true. No scene params are read.
// Linear chain (io.linear, v0.3 §20): the metering sees linear luminance, so the target is TARGET decoded through the
// sRGB curve (0.22 encoded ≈ 0.040 linear) — the same picture brightness aimed at in the space the frame is in.
import { srgbToLin1 } from '../math/oklab.js';
const TARGET = 0.22;      // metered luminance we aim the frame at (encoded terms)
const TAU_UP = 0.6;       // seconds to adapt when the gain is rising (frame got darker)
const TAU_DN = 1.5;       // seconds to adapt when the gain is falling (frame got brighter)

const FS_LUM = `
uniform sampler2D uTex; uniform vec2 uUvS;
void main(){ vec2 b = floor(gl_FragCoord.xy); float m = 0., q = 0.;
  for (int j = 0; j < 4; j++) for (int i = 0; i < 4; i++) {
    vec2 uv = (b + (vec2(float(i), float(j)) + .5) * .25) / 16.;
    vec3 c = texture(uTex, uv * uUvS).rgb;
    float l = dot(c, vec3(.2126, .7152, .0722));
    m += l; q += l * l; }
  o = vec4(m / 16., q / 16., 0., 1.); }`;

// uE = (target, rate up, rate down, reset). E is stored as E*.25 so it stays in 0..1 on an 8-bit target too.
const FS_EXPO = `
uniform sampler2D uLum, uPrev; uniform vec4 uE;
void main(){ float m = 0., q = 0.;
  for (int j = 0; j < 16; j++) for (int i = 0; i < 16; i++) {
    vec2 v = texelFetch(uLum, ivec2(i, j), 0).rg; m += v.r; q += v.g; }
  m /= 256.; q = sqrt(q / 256.);
  float metered = .55 * m + .45 * q;            // rms-weighted: sparse bright lines do not blow the frame out
  float prev = texelFetch(uPrev, ivec2(0), 0).r * 4.;
  float want = clamp(uE.x / max(metered, .003), .14, 2.2);
  float E = mix(prev, want, want < prev ? uE.z : uE.y);
  if (uE.w > .5) E = 1.;
  o = vec4(E * .25, metered, 0., 1.); }`;

const FS_APPLY = `
uniform sampler2D uSrc, uExp; uniform vec2 uUvS;
void main(){ float E = texelFetch(uExp, ivec2(0), 0).r * 4.;
  o = vec4(texture(uSrc, vUv * uUvS).rgb * E, 1.); }`;

export default {
  name: 'exposure',
  order: 30,
  enabled: false,
  init(ctx) {
    this.ctx = ctx;
    this.lumP = ctx.mkProg(FS_LUM, 'expo-lum');
    this.expoP = ctx.mkProg(FS_EXPO, 'expo-fold');
    this.applyP = ctx.mkProg(FS_APPLY, 'expo-apply');
    this.lum = ctx.mkTarget(16, 16);            // size-independent: allocated once, no resize hook
    this.e = [ctx.mkTarget(1, 1), ctx.mkTarget(1, 1)];
    this.pp = 0;
    this.lastFrame = -99;
    this.out = null;
    ctx.onResize((w, h) => {
      ctx.freeTarget(this.out);
      this.out = ctx.mkTarget(w, h);
    });
  },
  run(io) {
    const { gl, tex, tri, use } = this.ctx;
    if (!this.out) return null;
    // A gap in the frame numbers means we were just switched on: start from gain 1 instead of a stale/empty 1x1.
    const reset = io.frameN - this.lastFrame > 1 ? 1 : 0;
    this.lastFrame = io.frameN;
    const dt = Math.min(Math.max(io.dt || 0, 0), 0.25);
    const sx = io.uvS ? io.uvS[0] : 1, sy = io.uvS ? io.uvS[1] : 1;

    let pr = this.lumP;                          // pass 1: frame -> 16x16 tile luminance
    use(pr, this.lum, this.lum.w, this.lum.h);
    tex(pr, 'uTex', 0, io.src);
    gl.uniform2f(pr.u('uUvS'), sx, sy);
    tri();

    const prev = this.e[this.pp], cur = this.e[this.pp ^ 1];
    pr = this.expoP;                             // pass 2: 16x16 -> 1x1, blended with the previous 1x1
    use(pr, cur, 1, 1);
    tex(pr, 'uLum', 0, this.lum);
    tex(pr, 'uPrev', 1, prev);
    gl.uniform4f(pr.u('uE'), io.linear ? srgbToLin1(TARGET) : TARGET, 1 - Math.exp(-dt / TAU_UP), 1 - Math.exp(-dt / TAU_DN), reset);
    tri();
    this.pp ^= 1;

    pr = this.applyP;                            // pass 3: frame * gain -> full-size out
    use(pr, this.out, io.w, io.h);
    tex(pr, 'uSrc', 0, io.src);
    tex(pr, 'uExp', 1, cur);
    gl.uniform2f(pr.u('uUvS'), sx, sy);
    tri();
    return this.out;
  },
};
