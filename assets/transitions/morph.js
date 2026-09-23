// MORPH: synapse's flow-field crossfade as a transition (v0.2 §11). The incoming scene eats through the outgoing one
// along a value-noise front; both textures are advected by a noise flow field (uA pushed forward by t, uB pulled back
// by 1-t, both scaled by the kick) and a bright additive edge rides the front. Lifted from synapse2.html's FS_MORPH
// (POST_HEAD replaced by the shared HEAD, gl_FragCoord.xy/uR -> vUv, every sample clamped and scaled by uUvS).
// The one addition is `ease`: synapse advanced its own `trans` with level and kicks, here that musical push is a shape
// on top of the director's clock `m` -- t = max(m, ease), so the front may run ahead of the fade but never lags it
// (docs/CONTRACTS.md §5). Deterministic: only m, MS.lvl, MS.kick and io.dt feed it.

// How far ahead of the director's clock the music may pull the front.
const EASE_LVL = 0.18;   // extra fraction of dm per unit MS.lvl
const EASE_KICK = 0.12;  // ease added per second at full MS.kick (kick decays over 0.16 s, so ~0.01 per kick)

const FS = `
uniform sampler2D uA,uB;uniform vec2 uUvS;uniform vec3 uT;// uT = (t, MS.flow, MS.kick)
float hash21(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),f.x),f.y);}
// the scene pass lives at (sw,sh) inside (w,h): clamp before scaling or the advected edge reads the stale border
vec3 smp(sampler2D s,vec2 uv){return texture(s,clamp(uv,vec2(0.),vec2(1.))*uUvS).rgb;}
void main(){vec2 uv=vUv;vec2 c=uv-.5;c.x*=uRes.x/uRes.y;float t=uT.x,fl=uT.y,kk=uT.z;
  // the front: two value-noise octaves drifting on musical time, plus a radial term (the centre goes first).
  // Synapse's radial weight was .35 on an uncorrected uv and the sweep was t*1.5-1.05: at 16:9 that crossed the whole
  // frame in ~.19 of t, so by t=.5 the picture was already all uB. Here c is aspect-corrected (a round front) and the
  // radial weight is .75 against a t*2.1-1.65 sweep: the front leaves the centre at t~.3 and clears the corners at
  // t~.73, i.e. it sits mid-screen at t~.5. min(length(c),.9) bounds n from below at any aspect ratio, so
  // n in [-.1275, 1.55] and X = 2.1t-1.65+.9n obeys X(t=0) <= -.255 and X(t=1) >= .335: exactly uA at m->0, uB at m=1.
  float n=vnoise(uv*3.+fl*.2)*.55+vnoise(uv*9.-fl*.3)*.25+(1.-min(length(c),.9)*1.3)*.75;
  float m=smoothstep(-.15,.15,t*2.1-.75-(1.-n)*.9);
  vec2 wv=vec2(vnoise(uv*5.+3.+fl*.3),vnoise(uv*5.+9.-fl*.3))-.5;
  vec3 a=smp(uA,uv+wv*.22*t*(1.+kk));
  vec3 b=smp(uB,uv-wv*.22*(1.-t)*(1.+kk));
  float edge=exp(-pow((m-.5)*5.,2.))*sin(t*3.14159);
  o=vec4(mix(a,b,m)+(a+b)*edge*.9,1.);}`;

export default {
  name: 'morph',
  init(ctx) {
    this.ctx = ctx;
    this.pr = ctx.mkProg(FS, 'morph');
    this.ease = 0;
    this.mPrev = 2; // > 1: the first frame of the first fade resets
  },
  run(io) {
    const { gl, use, tex, tri } = this.ctx, pr = this.pr, MS = io.MS;
    const m = io.m;
    // a new fade (m restarts at dt/dur) or a reversed one (the core jumps to 1-m and swaps a/b): start over at m
    if (!(m >= this.mPrev)) this.ease = m;
    const dm = Math.max(0, m - this.mPrev);
    this.ease = Math.min(1, this.ease + dm * (1 + EASE_LVL * MS.lvl) + MS.kick * io.dt * EASE_KICK);
    this.mPrev = m;
    const t = Math.max(m, this.ease);
    this.ctx.log('morph m=' + m.toFixed(4) + ' t=' + t.toFixed(4) + ' lvl=' + MS.lvl.toFixed(3));
    use(pr, io.out, io.sw, io.sh);
    tex(pr, 'uA', 0, io.a);
    tex(pr, 'uB', 1, io.b);
    gl.uniform2f(pr.u('uUvS'), io.uvS[0], io.uvS[1]);
    gl.uniform3f(pr.u('uT'), t, MS.flow, MS.kick);
    tri();
    return io.out;
  },
};
