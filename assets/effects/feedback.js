// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// Solver after Pavel Dobryakov, WebGL-Fluid-Simulation (MIT, 2017) — https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
// after GPU Gems ch. 38 (Harris 2004)
// FEEDBACK: previous frame re-injected with decay, zoom and twist (the trails). Ping-pong pair f0/f1.
// Scene slots: post.fb.decay (number or fn(MS) → 0..1) and, since DECISIONS §105, post.fb.advect (number or fn(MS) → a gain on
// the fluid substrate's velocity): the trail is back-traced along engineTex.vel — Stam's semi-Lagrangian step, the reference's
// advect pass — so it rides the music's current instead of only shrinking toward the centre. Lifted from cardioid3 FS.fb.
// DEFAULT 0 since §109 (2026-10-09, the user: "I don't like the fluid dynamics effecting the other scenes (I think is the
// advection?) -> ie. nav, particles, torus, etc."): every scene runs the scalar pass unless its `post.fb.advect` opts in — FLUID
// (scenes/fluid, id 12) does with 1; `&post=<scene>.fb.advect=<gain>` is the one-run A/B (CONTRACTS §1.4).
// Linear chain (io.linear, v0.3 §20): this is the chain's first pass, so it decodes the scene's sRGB output here
// (uFb.w = 1) and its buffers hold linear radiance; the decay slot keeps its encoded meaning — a per-frame factor d
// on encoded values is d^2.2 on linear ones, so the trail length a scene tuned stays what it was.
// Two program objects: `pr` is the v0.2 shader, byte for byte, and runs whenever the substrate is off (`&fluid=0`, key W, no float
// render targets, `io.fluid` absent as in chain-smoke) or advect is 0 — the old path is the same compiled program with the same
// uniforms, so its md5s hold by construction (the `&fluid=0` list = v0.34's). `prA` adds the back-trace after the zoom/twist.
const GLSL = `
uniform sampler2D uScene,uPrev;uniform vec2 uUvS;uniform vec4 uFb; // decay, zoom, rot, linear
void main(){vec3 s=texture(uScene,vUv*uUvS).rgb;s=mix(s,srgbToLin(s),uFb.w);vec2 c=vUv-.5;c.x*=uRes.x/uRes.y;c=rot(uFb.z)*c*(1.-uFb.y);c.x/=uRes.x/uRes.y;
  vec3 p=texture(uPrev,c+.5).rgb;p=mix(p,p.gbr,.02)*uFb.x;o=vec4(max(s,p)+s*.0,1.);}`;
// The advected variant: uVel = engineTex.vel (screen fractions per second, y up, sim res, bilinear — the grain in the field
// averages out at frame res), uAdv = (advect gain, dt). The velocity is read at the frame's own position (after the zoom/twist)
// and the previous frame is fetched from where that parcel was dt ago: c − gain·dt·v. Clamped: CLAMP_TO_EDGE on uPrev would
// smear the border inward on a strong outward current; a clamp keeps the trace on the picture.
const GLSL_A = `
uniform sampler2D uScene,uPrev,uVel;uniform vec2 uUvS,uAdv;uniform vec4 uFb; // decay, zoom, rot, linear · uAdv: gain, dt
void main(){vec3 s=texture(uScene,vUv*uUvS).rgb;s=mix(s,srgbToLin(s),uFb.w);vec2 c=vUv-.5;c.x*=uRes.x/uRes.y;c=rot(uFb.z)*c*(1.-uFb.y);c.x/=uRes.x/uRes.y;
  c+=.5;c-=uAdv.x*uAdv.y*texture(uVel,c).xy;c=clamp(c,0.,1.);
  vec3 p=texture(uPrev,c).rgb;p=mix(p,p.gbr,.02)*uFb.x;o=vec4(max(s,p)+s*.0,1.);}`;

export default {
  name: 'feedback',
  order: 10,
  init(ctx) {
    this.pr = ctx.mkProg(ctx.oklch + GLSL, 'fb');
    this.prA = ctx.mkProg(ctx.oklch + GLSL_A, 'fb-advect');
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
    // §105: the advect gain — number or fn(MS) like decay; the old program whenever the substrate is off or the gain is 0.
    // §109: the default is 0 — a scene opts IN (FLUID does); the roster's trails do not ride the current (the user's call).
    const a = io.post.fb && io.post.fb.advect, ak = typeof a === 'function' ? a(S) : a !== undefined ? a : 0;
    const adv = !!(io.fluid && io.fluid.on && ak > 0);
    const pr = adv ? this.prA : this.pr;
    use(pr, f1, io.w, io.h);
    tex(pr, 'uScene', 0, io.src);
    tex(pr, 'uPrev', 1, f0);
    gl.uniform2f(pr.u('uUvS'), io.uvS[0], io.uvS[1]);
    const d = io.post.fb && io.post.fb.decay, dk = typeof d === 'function' ? d(S) : d !== undefined ? d : 0.7;
    const dEnc = S.dropEvt ? 0.2 : dk * (0.5 + 0.5 * S.presence);
    const decay = io.linear ? Math.pow(dEnc, 2.2) : dEnc;
    const zoom = 0.004 + 0.022 * S.bass + 0.03 * S.dropEnv;
    const rotv = 0.002 * Math.sin(S.harmUnw) + 0.004 * (S.hit - 0.3) * S.eS + 0.6 * io.GROOVE.vel * io.dt;
    gl.uniform4f(pr.u('uFb'), decay, zoom, rotv, io.linear ? 1 : 0);
    if (adv) {
      tex(pr, 'uVel', 2, io.fluid.tex.vel);
      gl.uniform2f(pr.u('uAdv'), ak, io.dt);
    }
    tri();
    io.decoded = !!io.linear;
    io.uvS = [1, 1]; // downstream effects sample the full target
    return f1;
  },
};
