// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// COMPOSITE: chromatic aberration + glitch rows + kaleidoscope + flash + bloom add + tonemap + vignette + dither,
// straight to the screen. Always last. Scene slot: post.kaleido (0..1 damping of the kaleidoscope, default 1).
// Lifted from cardioid3 FS.comp.
// Linear chain (io.linear, v0.3 §20, uTm.x = 1): the input, the bloom and the flash are linear radiance; the tonemap
// is (1 − exp(−k·c)) / (1 − exp(−k)) with k = uTm.y, normalised so linear 1.0 reaches display white (the old curve on
// encoded values, 1 − exp(−1.5c), never did: white in → 0.78); then the sRGB encode, and the vignette and dither stay
// on the encoded value (a display-space darkening and a quantisation step, both belong after the encode).
// The flash keeps its encoded meaning: FX.flash is "+f on encoded values", which on a black pixel gave the wash
// 1 − exp(−1.5f); in linear the add is the f' that puts the same wash on screen — f' = −ln(1 − (1 − e^−k)·lin(1 − e^−1.5f))/k
// (flash 0.9 → 0.34 linear). Without it a drop whites the whole frame out (0.9 of linear radiance is nearly white).
// uTm.z = 1 is the #test clip mask: white where any channel of the pre-tonemap sum is ≥ 1 (tools/chain-smoke.js).
import { srgbToLin1 } from '../math/oklab.js';
const GLSL = `
uniform sampler2D uT,uB1,uB2;uniform vec4 uFx;uniform vec4 uFx2;uniform vec3 uTm; // ca, glitch, kaleido, flash | bloom, seed, segs, idle | linear, k, clipmask
vec2 kal(vec2 uv){vec2 c=uv-.5;c.x*=uRes.x/uRes.y;float a=atan(c.y,c.x)+uTime*.05,r=length(c);float s=TAU/uFx2.z;a=abs(mod(a,s)-s*.5);c=r*vec2(cos(a),sin(a));c.x/=uRes.x/uRes.y;return c+.5;}
vec3 take(vec2 uv){vec2 d=(uv-.5)*uFx.x;vec3 c=vec3(texture(uT,uv+d).r,texture(uT,uv).g,texture(uT,uv-d).b);
  c+=(texture(uB1,uv).rgb*.6+texture(uB2,uv).rgb*.9)*uFx2.x;return c;}
void main(){vec2 uv=vUv;
  if(uFx.y>.01){float row=floor(uv.y*(14.+20.*hash(vec2(uFx2.y,1.))));float h=hash(vec2(row,uFx2.y));if(h>1.-uFx.y*.6)uv.x=fract(uv.x+(hash(vec2(row,uFx2.y+3.))-.5)*.25*uFx.y);}
  vec3 c=take(uv);if(uFx.z>.01)c=mix(c,take(kal(uv)),uFx.z);
  c+=uFx.w;if(uTm.z>.5){o=vec4(vec3(step(1.,max(c.r,max(c.g,c.b)))),1.);return;}
  if(uTm.x>.5){c=clamp((1.-exp(-c*uTm.y))/(1.-exp(-uTm.y)),0.,1.);c=linToSrgb(c);}else c=1.-exp(-c*1.5);
  vec2 q=vUv-.5;c*=1.-dot(q,q)*.9;c+=(hash(vUv*uRes+uFx2.y)-.5)/255.;o=vec4(c,1.);}`;

export default {
  name: 'composite',
  order: 100,
  init(ctx) {
    this.ctx = ctx;
    this.pr = ctx.mkProg(ctx.oklch + GLSL, 'comp');
    this.clipMask = 0; // #test: CARD.EFFECTS composite .clipMask = 1 → the pre-tonemap clip mask instead of the picture
  },
  run(io) {
    const { gl, tex, tri, use } = this.ctx, S = io.MS, FX = io.FX, pr = this.pr;
    const bl = io.aux.bloom || { b1: io.src, b2: io.src };
    use(pr, null, io.w, io.h);
    tex(pr, 'uT', 0, io.src);
    tex(pr, 'uB1', 1, bl.b1);
    tex(pr, 'uB2', 2, bl.b2);
    const kd = io.post.kaleido !== undefined ? io.post.kaleido : 1;
    const k = io.k, flash = io.linear ? -Math.log(Math.max(1e-6, 1 - (1 - Math.exp(-k)) * srgbToLin1(1 - Math.exp(-1.5 * FX.flash)))) / k : FX.flash;
    gl.uniform4f(pr.u('uFx'), FX.ca, FX.glitch, FX.kal * kd, flash);
    gl.uniform4f(pr.u('uFx2'), 0.4 + 0.4 * S.eS + 0.3 * S.dropEnv, FX.seed, [6, 8, 10, 12][S.sectionId % 4], 0);
    gl.uniform3f(pr.u('uTm'), io.linear ? 1 : 0, k, this.clipMask);
    tri();
    return null;
  },
};
