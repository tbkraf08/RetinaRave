// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// BLOOM: threshold + two downsampled separable blurs (1/4 and 1/8). Publishes io.aux.bloom = {b1, b2} for the
// composite; leaves io.src untouched. Scene slot: post.bloom.thr (number or fn(MS)). Lifted from cardioid3 FS.down/blur.
// Linear chain (io.linear, v0.3 §20): the input is linear radiance; the threshold slot keeps its encoded meaning —
// thr and the knee thr + .5 are decoded through the sRGB curve, so "bloom above encoded 0.35" stays that.
import { srgbToLin1 } from '../math/oklab.js';
const DOWN = `
uniform sampler2D uT;uniform vec2 uTx;uniform vec2 uThr;
void main(){vec3 c=vec3(0.);for(int i=0;i<4;i++){vec2 of=vec2(float(i&1),float(i>>1))*2.-1.;c+=texture(uT,vUv+of*uTx).rgb;}c*=.25;
  float l=max(c.r,max(c.g,c.b));o=vec4(c*smoothstep(uThr.x,uThr.y,l),1.);}`;
const BLUR = `
uniform sampler2D uT;uniform vec2 uDirTx;
void main(){vec3 c=texture(uT,vUv).rgb*.227;c+=(texture(uT,vUv+uDirTx*1.385).rgb+texture(uT,vUv-uDirTx*1.385).rgb)*.316;
  c+=(texture(uT,vUv+uDirTx*3.231).rgb+texture(uT,vUv-uDirTx*3.231).rgb)*.0703;o=vec4(c,1.);}`;

export default {
  name: 'bloom',
  order: 20,
  init(ctx) {
    this.ctx = ctx;
    this.down = ctx.mkProg(DOWN, 'down');
    this.blur = ctx.mkProg(BLUR, 'blur');
    ctx.onResize((w, h) => {
      for (const k of ['b1', 'b1b', 'b2', 'b2b']) ctx.freeTarget(this[k]);
      const w4 = Math.max(8, w >> 2), h4 = Math.max(8, h >> 2), w8 = Math.max(4, w >> 3), h8 = Math.max(4, h >> 3);
      this.b1 = ctx.mkTarget(w4, h4);
      this.b1b = ctx.mkTarget(w4, h4);
      this.b2 = ctx.mkTarget(w8, h8);
      this.b2b = ctx.mkTarget(w8, h8);
    });
  },
  run(io) {
    const { gl, tex, tri, use } = this.ctx, S = io.MS;
    const t = io.post.bloom && io.post.bloom.thr, thr = typeof t === 'function' ? t(S) : t !== undefined ? t : 0.35;
    const b1 = this.b1, b1b = this.b1b, b2 = this.b2, b2b = this.b2b;
    let pr = this.down;
    use(pr, b1, b1.w, b1.h);
    tex(pr, 'uT', 0, io.src);
    gl.uniform2f(pr.u('uTx'), 1 / io.w, 1 / io.h);
    if (io.linear && thr > 0) gl.uniform2f(pr.u('uThr'), srgbToLin1(thr), srgbToLin1(thr + 0.5));
    else gl.uniform2f(pr.u('uThr'), thr, thr + 0.5); // thr ≤ 0 = pass everything (no decode: the knee must stay open)
    tri();
    pr = this.blur;
    use(pr, b1b, b1.w, b1.h);
    tex(pr, 'uT', 0, b1);
    gl.uniform2f(pr.u('uDirTx'), 1 / b1.w, 0);
    tri();
    use(pr, b1, b1.w, b1.h);
    tex(pr, 'uT', 0, b1b);
    gl.uniform2f(pr.u('uDirTx'), 0, 1 / b1.h);
    tri();
    pr = this.down;
    use(pr, b2, b2.w, b2.h);
    tex(pr, 'uT', 0, b1);
    gl.uniform2f(pr.u('uTx'), 0.5 / b1.w, 0.5 / b1.h);
    gl.uniform2f(pr.u('uThr'), -1, -0.5);
    tri();
    pr = this.blur;
    use(pr, b2b, b2.w, b2.h);
    tex(pr, 'uT', 0, b2);
    gl.uniform2f(pr.u('uDirTx'), 1 / b2.w, 0);
    tri();
    use(pr, b2, b2.w, b2.h);
    tex(pr, 'uT', 0, b2b);
    gl.uniform2f(pr.u('uDirTx'), 0, 1 / b2.h);
    tri();
    io.aux.bloom = { b1, b2 };
    return null;
  },
};
