// FEEDBACK: previous frame re-injected with decay, zoom and twist (the trails). Ping-pong pair f0/f1.
// Scene slot: post.fb.decay (number or fn(MS) → 0..1). Lifted from cardioid3 FS.fb.
const GLSL = `
uniform sampler2D uScene,uPrev;uniform vec2 uUvS;uniform vec4 uFb; // decay, zoom, rot, flash
void main(){vec3 s=texture(uScene,vUv*uUvS).rgb;vec2 c=vUv-.5;c.x*=uRes.x/uRes.y;c=rot(uFb.z)*c*(1.-uFb.y);c.x/=uRes.x/uRes.y;
  vec3 p=texture(uPrev,c+.5).rgb;p=mix(p,p.gbr,.02)*uFb.x;o=vec4(max(s,p)+s*.0,1.);}`;

export default {
  name: 'feedback',
  order: 10,
  init(ctx) {
    this.pr = ctx.mkProg(GLSL, 'fb');
    this.ctx = ctx;
    ctx.onResize((w, h) => {
      ctx.freeTarget(this.f0);
      ctx.freeTarget(this.f1);
      this.f0 = ctx.mkTarget(w, h);
      this.f1 = ctx.mkTarget(w, h);
    });
  },
  run(io) {
    const { gl, tex, tri, use } = this.ctx, S = io.MS;
    const f0 = io.frameN & 1 ? this.f0 : this.f1, f1 = io.frameN & 1 ? this.f1 : this.f0;
    const pr = this.pr;
    use(pr, f1, io.w, io.h);
    tex(pr, 'uScene', 0, io.src);
    tex(pr, 'uPrev', 1, f0);
    gl.uniform2f(pr.u('uUvS'), io.uvS[0], io.uvS[1]);
    const d = io.post.fb && io.post.fb.decay, dk = typeof d === 'function' ? d(S) : d !== undefined ? d : 0.7;
    const decay = S.dropEvt ? 0.2 : dk * (0.5 + 0.5 * S.presence);
    const zoom = 0.004 + 0.022 * S.bass + 0.03 * S.dropEnv;
    const rotv = 0.002 * Math.sin(S.harmUnw) + 0.004 * (S.hit - 0.3) * S.eS + 0.6 * io.GROOVE.vel * io.dt;
    gl.uniform4f(pr.u('uFb'), decay, zoom, rotv, 0);
    tri();
    io.uvS = [1, 1]; // downstream effects sample the full target
    return f1;
  },
};
