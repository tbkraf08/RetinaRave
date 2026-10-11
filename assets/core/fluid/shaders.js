// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// Solver after Pavel Dobryakov, WebGL-Fluid-Simulation (MIT, 2017) — https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
// after GPU Gems ch. 38 (Harris 2004)
// The substrate's GLSL (FLUID-PLAN Step 1). Every program is built with ctx-style mkProg(fs, name), so HEAD is prepended
// (vUv, o, the common uniforms — unused here and compiled out). Velocity is stored in SCREEN FRACTIONS PER SECOND (uv/s)
// and the grid's texels are square in pixels, so the finite differences convert to texel units with uScale = (simW, simH):
// u_texel = v_uv · uScale, and the advection back-trace is exactly vUv − v·dt. Nothing here is copied from the reference;
// the pass order (curl → vorticity → divergence → pressure Jacobi → gradient subtract → advect) is its lineage.

// The neighbour offsets every stencil pass uses. uTexel = 1 / target size.
const NB = `uniform vec2 uTexel;
vec2 vL(){return vUv-vec2(uTexel.x,0.);}vec2 vR(){return vUv+vec2(uTexel.x,0.);}
vec2 vT(){return vUv+vec2(0.,uTexel.y);}vec2 vB(){return vUv-vec2(0.,uTexel.y);}
`;

// Splats: one draw per target, every splat of the frame in a uniform array (uSplat = x y dx dy in uv and uv/s, uCol = r g b
// radius). Additive on the ping-pong read: base + Σ exp(−|p|²/r) · value, p aspect-corrected as the reference does.
export const SPLAT = `
uniform sampler2D uSrc;uniform vec4 uSplat[16];uniform vec4 uCol[16];uniform int uN;uniform float uAspect;uniform int uDye;
void main(){vec4 b=texture(uSrc,vUv);vec3 a=vec3(0.);
for(int i=0;i<16;i++){if(i>=uN)break;vec2 p=vUv-uSplat[i].xy;p.x*=uAspect;float g=exp(-dot(p,p)/uCol[i].w);
a+=g*(uDye==1?uCol[i].xyz:vec3(uSplat[i].zw,0.));}
o=vec4(b.xyz+a,1.);}`;

// curl = ∂v/∂x − ∂u/∂y in 1/s (texel units: the uv differences scaled by the grid).
export const CURL = NB + `
uniform sampler2D uVel;uniform vec2 uScale;
void main(){float L=texture(uVel,vL()).y*uScale.y,R=texture(uVel,vR()).y*uScale.y,T=texture(uVel,vT()).x*uScale.x,B=texture(uVel,vB()).x*uScale.x;
o=vec4(.5*(R-L-T+B),0.,0.,1.);}`;

// Vorticity confinement: push toward the local curl's gradient, scaled by uCurl (the `curl` param) and dt.
// §116 S3 uCurlMask (y0, y1, lo, feather): the band grammar's MASK on the confinement — its full value inside the band y0..y1 of the screen's
// height, lo × it outside, the edges feathered over `feather` (smoothstep each side). lo = 1 is the identical program path (the branch not
// taken; fluid.js passes (0, 1, 1, 0) when the grammar returns no `params.curlMask`) — a uniform branch, never a mix, as the ring's A = 0.
export const VORT = NB + `
uniform sampler2D uVel,uCurl;uniform vec2 uScale;uniform float uCurlK,uDt;uniform vec4 uCurlMask;
void main(){float L=texture(uCurl,vL()).x,R=texture(uCurl,vR()).x,T=texture(uCurl,vT()).x,B=texture(uCurl,vB()).x,C=texture(uCurl,vUv).x;
vec2 f=.5*vec2(abs(T)-abs(B),abs(R)-abs(L));f/=length(f)+1e-4;f*=uCurlK*C;f.y=-f.y;
if(uCurlMask.z<1.){float m=smoothstep(uCurlMask.x-uCurlMask.w,uCurlMask.x,vUv.y)*(1.-smoothstep(uCurlMask.y,uCurlMask.y+uCurlMask.w,vUv.y));f*=mix(uCurlMask.z,1.,m);}
vec2 v=texture(uVel,vUv).xy*uScale;v+=f*uDt;v=clamp(v,vec2(-1000.),vec2(1000.));
o=vec4(v/uScale,0.,1.);}`;

// Divergence with the closed (no-through) wall: a neighbour outside the pool is the mirrored centre.
export const DIV = NB + `
uniform sampler2D uVel;uniform vec2 uScale;
void main(){vec2 C=texture(uVel,vUv).xy*uScale;
float L=texture(uVel,vL()).x*uScale.x,R=texture(uVel,vR()).x*uScale.x,T=texture(uVel,vT()).y*uScale.y,B=texture(uVel,vB()).y*uScale.y;
if(vL().x<0.)L=-C.x;if(vR().x>1.)R=-C.x;if(vT().y>1.)T=-C.y;if(vB().y<0.)B=-C.y;
o=vec4(.5*(R-L+T-B),0.,0.,1.);}`;

// Scale a texture by a constant: the pressure's warm start (× uPressure) and the tier-change copy (× 1).
export const SCALE = `
uniform sampler2D uSrc;uniform float uK;
void main(){o=uK*texture(uSrc,vUv);}`;

// One Jacobi relaxation of ∇²p = div.
export const JACOBI = NB + `
uniform sampler2D uP,uDiv;
void main(){float L=texture(uP,vL()).x,R=texture(uP,vR()).x,T=texture(uP,vT()).x,B=texture(uP,vB()).x,d=texture(uDiv,vUv).x;
o=vec4((L+R+B+T-d)*.25,0.,0.,1.);}`;

// Subtract the pressure gradient → a divergence-free field (back in uv/s).
export const GRAD = NB + `
uniform sampler2D uP,uVel;uniform vec2 uScale;
void main(){float L=texture(uP,vL()).x,R=texture(uP,vR()).x,T=texture(uP,vT()).x,B=texture(uP,vB()).x;
vec2 v=texture(uVel,vUv).xy*uScale;v-=vec2(R-L,T-B);
o=vec4(v/uScale,0.,1.);}`;

// Semi-Lagrangian advection (Stam 1999): the value that lands here left from vUv − v·dt. uDiss is the dissipation
// (per second: 1/(1+uDiss·dt)); on the velocity pass uBody is the beat's breath — a vertical push with a cos(π(2x−1))
// profile (centre down, edges up): a UNIFORM force in a closed pool is a pure pressure gradient the projection removes, so
// the breath is given curl on purpose (DECISIONS §104) — and uForce a scene's uniform body force (ctx.fluid.force; the
// same caveat). Both 0 on the dye pass.
// §113 uRing = (A, front, width): the SHOCKWAVE — a radial ring round the screen's centre (r in screen heights, p.x aspect-corrected).
// On the VELOCITY pass (uDye 0) it is SET into the velocity at the front with the Gaussian m = exp(−((r − front)/w)²) as the mix:
// v → A·r̂ (uv/s: x over the aspect). Set, not added — a radial field is curl-free, the projection would strip an added one to its
// Jacobi residual; set each step it never accumulates, and the dye advect (which samples this pass's output) rides it the same frame.
// On the DYE pass (uDye 1) the ring's own DIVERGENCE dilutes and compacts the ink: semi-Lagrangian advection COPIES values, so a
// divergent field alone stretches the centre's ink over the disc and empties nothing (measured: WhoLikesToParty's centre 62 → 65–69 with
// the ring and no dissipation spike) — a pressure wave is compressible for the ink, ρ ← ρ·(1 − ∇·v·dt), and ∇·(m·A·r̂) = A·m·(1/r −
// 2(r − front)/w²) is analytic: positive inside the front (the ink thinned as the front sweeps through it), negative outside (piled up
// at the front) — the ink is CARRIED outward, not copied. A = 0 is the identical program path (a uniform branch), so every step without
// a wave is bit-for-bit the §104 pass.
// §116 S1 uSwirl: the band grammar's SWIRL — a solid-body rotation round the screen's centre on the VELOCITY pass, the angular
// acceleration uSwirl (1/s², p aspect-corrected in screen heights: v += uSwirl·dt·(−p.y, p.x), the x back over the aspect). Its curl
// is 2·uSwirl everywhere, so the projection keeps it in a closed box (only the walls' normal part goes). 0 is the identical program path
// (a uniform branch, never a mix — the roster's and FLUID's identity rest on it as on the ring's); the dye pass always passes 0.
// §116 S2 uRingC: the ring's CENTRE (uv) — (.5, .5) for the shockwave (vUv − uRingC is vUv − .5 to the bit: one subtraction of an exact
// half either way), the kick's place for the band grammar's puff (KICK_SHAPE 4: a small radial puff round the hit, the same set semantics).
// §116 S4 uNoise / uSeed: the band grammar's GRAIN — on the VELOCITY pass a hashed push per texel, ±½·uNoise·uDt in screen heights (x over the
// aspect), white in space (the texel) and in time (uSeed = the step count & 255, fluid.js — deterministic from at=0, never a clock): a Wang
// integer hash on (texel, seed) — uint arithmetic, bit-exact on every driver, no sin. The projection strips its divergent half and the grid's
// diffusion eats the rest within a few steps: what stays is a texel-scale wrinkle the dye reads as grain, never a push on the mass (the
// amplitude is the grammar's NOISE_V · highEnv · g, guarded by the strips' speed ruler). 0 is the identical program path (a uniform branch);
// the dye pass always passes 0 for uNoise (the velocity grain is velocity only). uCell = sim texels per hash cell (the grammar's NOISE_CELL:
// a per-texel white push is what the solver removes — a cell of a few texels, held a few steps through uSeed, keeps a solenoidal part).
// uJit (uv, the DYE pass only; 0 on the velocity pass): the back-trace sample point c is jittered ±½·uJit by the same hash — the ink is
// read from a point a fraction of a dye texel off, re-drawn every hold: film grain on the ink's edges, zero force (the velocity never sees
// it). (0, 0) is the identical dye pass.
export const ADVECT = `
uniform sampler2D uVel,uSrc;uniform float uDt,uDiss,uBody,uAspect,uSwirl,uNoise;uniform vec2 uForce,uRingC,uJit;uniform vec3 uRing;uniform int uDye,uSeed,uCell;
uint wang(uint n){n=(n^61u)^(n>>16u);n*=9u;n^=n>>4u;n*=0x27d4eb2du;n^=n>>15u;return n;}
vec2 grain(uvec2 q){uint a=wang(q.x+q.y*4096u+uint(uSeed)*16777216u),b=wang(a^0x9e3779b9u);return vec2(float(a&65535u),float(b&65535u))/65535.-.5;}
void main(){vec2 c=vUv-uDt*texture(uVel,vUv).xy;
if(uJit.x>0.){c+=uJit*grain(uvec2(gl_FragCoord.xy));}
vec4 r=texture(uSrc,c)/(1.+uDiss*uDt);
r.y+=uBody*uDt*cos(3.14159265*(2.*vUv.x-1.));r.xy+=uForce*uDt;
if(uSwirl!=0.){vec2 s=vUv-.5;s.x*=uAspect;r.xy+=uSwirl*uDt*vec2(-s.y/uAspect,s.x);}
if(uNoise>0.){vec2 g=grain(uvec2(gl_FragCoord.xy)/uint(max(uCell,1)));r.xy+=uNoise*uDt*vec2(g.x/uAspect,g.y);}
if(uRing.x>0.){vec2 p=vUv-uRingC;p.x*=uAspect;float d=max(length(p),1e-3);float m=exp(-pow((d-uRing.y)/uRing.z,2.));
if(uDye==1){float dv=uRing.x*m*(1./d-2.*(d-uRing.y)/(uRing.z*uRing.z));r.xyz*=dv>0.?1./(1.+dv*uDt):1.-dv*uDt;}
else{vec2 h=p/d;r.xy=mix(r.xy,uRing.x*vec2(h.x/uAspect,h.y),m);}}
o=r;}`;

// Harness only (&fluiddbg=): the dye on the screen (encoded for the eye), the velocity as an inset (0.5 + v·uGain).
export const DBG = `
uniform sampler2D uDye,uVel;uniform vec4 uInset;uniform float uGain;uniform int uMode;
vec3 enc(vec3 c){return pow(max(c,0.),vec3(1./2.2));}
void main(){vec3 c;
if(uMode==2){vec2 v=texture(uVel,vUv).xy;c=vec3(.5+v.x*uGain,.5+v.y*uGain,.5);}
else{c=enc(texture(uDye,vUv).rgb);
vec2 q=(vUv-uInset.xy)/uInset.zw;if(uMode==1&&q.x>=0.&&q.y>=0.&&q.x<1.&&q.y<1.){vec2 v=texture(uVel,q).xy;c=vec3(.5+v.x*uGain,.5+v.y*uGain,.5);}}
o=vec4(c,1.);}`;
