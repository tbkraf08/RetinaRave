// COMPOSITE: chromatic aberration + glitch rows + kaleidoscope + flash + bloom add + tonemap + vignette + dither,
// straight to the screen. Always last. Scene slot: post.kaleido (0..1 damping of the kaleidoscope, default 1).
// Lifted from cardioid3 FS.comp.
const GLSL = `
uniform sampler2D uT,uB1,uB2;uniform vec4 uFx;uniform vec4 uFx2; // ca, glitch, kaleido, flash | bloom, seed, segs, idle
vec2 kal(vec2 uv){vec2 c=uv-.5;c.x*=uRes.x/uRes.y;float a=atan(c.y,c.x)+uTime*.05,r=length(c);float s=TAU/uFx2.z;a=abs(mod(a,s)-s*.5);c=r*vec2(cos(a),sin(a));c.x/=uRes.x/uRes.y;return c+.5;}
vec3 take(vec2 uv){vec2 d=(uv-.5)*uFx.x;vec3 c=vec3(texture(uT,uv+d).r,texture(uT,uv).g,texture(uT,uv-d).b);
  c+=(texture(uB1,uv).rgb*.6+texture(uB2,uv).rgb*.9)*uFx2.x;return c;}
void main(){vec2 uv=vUv;
  if(uFx.y>.01){float row=floor(uv.y*(14.+20.*hash(vec2(uFx2.y,1.))));float h=hash(vec2(row,uFx2.y));if(h>1.-uFx.y*.6)uv.x=fract(uv.x+(hash(vec2(row,uFx2.y+3.))-.5)*.25*uFx.y);}
  vec3 c=take(uv);if(uFx.z>.01)c=mix(c,take(kal(uv)),uFx.z);
  c+=uFx.w;c=1.-exp(-c*1.5);vec2 q=vUv-.5;c*=1.-dot(q,q)*.9;c+=(hash(vUv*uRes+uFx2.y)-.5)/255.;o=vec4(c,1.);}`;

export default {
  name: 'composite',
  order: 100,
  init(ctx) {
    this.ctx = ctx;
    this.pr = ctx.mkProg(GLSL, 'comp');
  },
  run(io) {
    const { gl, tex, tri, use } = this.ctx, S = io.MS, FX = io.FX, pr = this.pr;
    const bl = io.aux.bloom || { b1: io.src, b2: io.src };
    use(pr, null, io.w, io.h);
    tex(pr, 'uT', 0, io.src);
    tex(pr, 'uB1', 1, bl.b1);
    tex(pr, 'uB2', 2, bl.b2);
    const kd = io.post.kaleido !== undefined ? io.post.kaleido : 1;
    gl.uniform4f(pr.u('uFx'), FX.ca, FX.glitch, FX.kal * kd, FX.flash);
    gl.uniform4f(pr.u('uFx2'), 0.4 + 0.4 * S.eS + 0.3 * S.dropEnv, FX.seed, [6, 8, 10, 12][S.sectionId % 4], 0);
    tri();
    return null;
  },
};
