// MIXS: v3's crossfade, moved verbatim from core/scenes.js (v0.2 §11) — two counter-rotating, counter-zooming samples
// of the outgoing (uA) and incoming (uB) scene blended along a luminance-biased front driven by uM = the crossfade
// position. The default transition (docs/CONTRACTS.md §5); pixel-identical to the v0.1 core pass.
const FS = `
uniform sampler2D uA,uB;uniform float uM;uniform vec2 uUvS;
vec3 smp(sampler2D s,vec2 uv){return texture(s,clamp(uv,vec2(0.),vec2(1.))*uUvS).rgb;}
void main(){vec2 c=vUv-.5;c.x*=uRes.x/uRes.y;float m=uM*uM*(3.-2.*uM);
  vec2 a=rot(m*.7)*c*(1.-.45*m),b=rot(-(1.-m)*.7)*c*(1.+.8*(1.-m));a.x/=uRes.x/uRes.y;b.x/=uRes.x/uRes.y;
  vec3 A=smp(uA,a+.5),B=smp(uB,b+.5);float la=dot(A,vec3(.33)),lb=dot(B,vec3(.33));
  float k=smoothstep(-.25,.25,(m*1.5-.25)+(lb-la)*.6-(1.-m)*length(c)*.3+m*.0);o=vec4(mix(A,B,clamp(k*step(.001,m),0.,1.)),1.);}`;

export default {
  name: 'mixs',
  init(ctx) {
    this.ctx = ctx;
    this.pr = ctx.mkProg(FS, 'mixs');
  },
  run(io) {
    const { gl, use, tex, tri } = this.ctx, pr = this.pr;
    use(pr, io.out, io.sw, io.sh);
    tex(pr, 'uA', 0, io.a);
    tex(pr, 'uB', 1, io.b);
    gl.uniform1f(pr.u('uM'), io.m);
    gl.uniform2f(pr.u('uUvS'), io.uvS[0], io.uvS[1]);
    tri();
    return io.out;
  },
};
