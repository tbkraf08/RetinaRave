// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// Solver after Pavel Dobryakov, WebGL-Fluid-Simulation (MIT, 2017) — https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
// after GPU Gems ch. 38 (Harris 2004)
// NAVPOOL's own fluid GLSL (DECISIONS §149 unit 2; Toma: "I thought the edge of the set would become the walls that it bounces the
// fluid off of?"). The passes are the core substrate's (assets/core/fluid/shaders.js — read, not imported: a scene imports nothing
// from core) with the JULIA SET'S BOUNDARY AS A SOLID WALL: uM is the mask this scene renders each frame at the sim grid (1 = inside
// the filled Julia set = fluid, ≤ .5 = escaped = solid; a one-cell soft edge from the distance estimate), uMp the previous frame's.
// Fluid is m > WALL (.75). Velocity is in screen fractions per second (uv/s) and texel units through uScale = (simW, simH), as the core's.
//   MASK   the escape test of shaders-v2.js's FS_JULIA_V2 with the same uniforms (uC uView uIter uIterLo uLam uZs uEps2) at the sim grid
//   WALLV  a solid cell takes the WALL's velocity: the mask's change over the frame along its gradient, −Δm/dt texels/s along n̂ (toward
//          the fluid), × uWall.x, clamped to uWall.y — the set advancing into the ink shoves it, retreating drags it
//   DIV    0 in a solid cell; a solid neighbour's velocity is its wall velocity (WALLV wrote it), the screen's edges mirrored
//   JACOBI / GRAD  Neumann at the wall: a solid neighbour's pressure reads the centre's; a solid cell keeps its wall velocity
//   ADVECT the velocity: a back-trace that lands in the solid reads the cell's own value (nothing flows out of the wall); ADYE the dye (below).
//          §151 uSlip (KS.SLIP, A/B only, default 0 = the old line exactly): the back-trace mask-weighted as ADYE's (a solid tap reads the
//          cell's own velocity): free slip at the staircase wall instead of the bilinear blend of the wall's zero tangential velocity
//          ADYE moves the ink the edge sweeps over onto the rim (conservative), its wall level uThr below WALL so it reaches the drawn edge
const NB = `uniform vec2 uTexel;
vec2 vL(){return vUv-vec2(uTexel.x,0.);}vec2 vR(){return vUv+vec2(uTexel.x,0.);}
vec2 vT(){return vUv+vec2(0.,uTexel.y);}vec2 vB(){return vUv-vec2(0.,uTexel.y);}
`;
const WALL = 'const float WALL=.75;\n';

export const MASK = `
uniform vec2 uC;uniform vec4 uView;uniform int uIter;uniform int uIterLo;uniform vec4 uLam;uniform vec2 uZs;uniform float uEps2;uniform float uHz;
void main(){vec2 p=(vUv*2.-1.)*vec2(uRes.x/uRes.y,1.);vec2 z=uView.xy+uView.z*(rot(uView.w)*p);
vec2 dz=vec2(1.,0.);float m2=dot(z,z);bool esc=false,big=false;
for(int i=0;i<420;i++){if(i>=uIter)break;float dd=1e31;
 if(!big){dz=2.*cmul(z,dz);dd=dot(dz,dz);if(dd>1e30)big=true;}
 z=vec2(z.x*z.x-z.y*z.y,2.*z.x*z.y)+uC;m2=dot(z,z);
 if(m2>1e4){esc=true;break;}
 if(uLam.w>.5){vec2 w=z-uZs;if(dot(w,w)<uEps2)break;}else if(i>=uIterLo&&dd<1.)break;}
float m=1.;if(esc){float d=big?0.:.5*sqrt(m2/dot(dz,dz))*log(m2);m=.5*clamp(1.-d/uHz,0.,1.);}
o=vec4(m,0.,0.,1.);}`;

export const SPLAT = `
uniform sampler2D uSrc;uniform vec4 uSplat[16];uniform vec4 uCol[16];uniform int uN;uniform float uAspect;uniform int uDye;
void main(){vec4 b=texture(uSrc,vUv);vec3 a=vec3(0.);
for(int i=0;i<16;i++){if(i>=uN)break;vec2 p=vUv-uSplat[i].xy;p.x*=uAspect;float g=exp(-dot(p,p)/uCol[i].w);
a+=g*(uDye==1?uCol[i].xyz:vec3(uSplat[i].zw,0.));}
o=vec4(b.xyz+a,1.);}`;

export const WALLV = NB + WALL + `
uniform sampler2D uVel,uM,uMp;uniform vec2 uScale;uniform float uDt;uniform vec2 uWall;
void main(){float m=texture(uM,vUv).x;if(m>WALL){o=vec4(texture(uVel,vUv).xy,0.,1.);return;}
vec2 g=vec2(texture(uM,vR()).x-texture(uM,vL()).x,texture(uM,vT()).x-texture(uM,vB()).x);float gl=length(g);vec2 n=gl>.05?g/gl:vec2(0.);
float s=clamp(-(m-texture(uMp,vUv).x)/max(uDt,1e-4)*uWall.x,-uWall.y,uWall.y);
o=vec4(n*s/uScale,0.,1.);}`;

// §151 THE PADDLE (Toma: "the fluid is pushed where the edge is going and keeps moving afterwards"). WALLV sees only the normal part
// of the edge's motion (−Δm/dt); the view's rigid turn / zoom / slide (uRig = spin, grow, R(−w)·ẋy/s: ṗ = −spin·J·p − grow·p − uRig.zw,
// p = (2uv − 1)(asp, 1); edgeRates in pool-sim.js) moves the set along itself too.
//   EDGE   on a wall cell (solid, |∇m| > .05): raw = WALLV's velocity (the observed normal speed) + the rigid field's tangential part
//          (texel space, isotropic); elsewhere 0. edg = mix(raw, edgOld, uA), uA = e^{−dt/EDGE_TAU}: the edge's velocity with inertia
//   PADDLE on a fluid cell: d = the nearest radius 1..band (8 directions) with a solid tap; ue = gain · mean(edg of those taps), capped
//          (height units: uv · (asp, 1)); the cell takes up the paddle's speed along ê = ue/|ue| ONE-SIDED: v += ê·gap·w·uPad.w when
//          gap = |ue| − v·ê > 0, the impulse capped at |ue| itself: v += ê·min(gap, |ue|)·w·uPad.w (w = 1 − (d − 1)/band, uPad.w =
//          1 − e^{−PADDLE_K·dt}) — the plan's uncapped gap BRAKED: as edg decays after a stop its direction is noise, and a flow opposing
//          ê has a large gap, so it was dragged to ~0 (the rim collapsed .11 → .05 uv/s in 6 frames). Capped, a near-still paddle adds
//          ~nothing and the pool coasts on after the edge stops
export const EDGE = NB + WALL + `
uniform sampler2D uVel,uM,uE;uniform vec2 uScale;uniform vec4 uRig;uniform float uA,uNorm;
void main(){float m=texture(uM,vUv).x;vec2 raw=vec2(0.);
if(m<=WALL){vec2 g=vec2(texture(uM,vR()).x-texture(uM,vL()).x,texture(uM,vT()).x-texture(uM,vB()).x);float gl=length(g);
 if(gl>.05){vec2 n=g/gl,H=vec2(uScale.x/uScale.y,1.),p=(vUv*2.-1.)*H;
  vec2 uR=(uRig.x*vec2(p.y,-p.x)-uRig.y*p-uRig.zw)/H*.5;vec2 t=uR*uScale;t-=dot(t,n)*n;
  raw=uNorm*texture(uVel,vUv).xy+t/uScale;}}
o=vec4(mix(raw,texture(uE,vUv).xy,uA),0.,1.);}`;

export const PADDLE = NB + WALL + `
uniform sampler2D uVel,uM,uE;uniform vec2 uScale;uniform vec4 uPad;
void main(){vec2 v=texture(uVel,vUv).xy;if(texture(uM,vUv).x<=WALL){o=vec4(v,0.,1.);return;}
vec2 D[8]=vec2[8](vec2(1.,0.),vec2(1.,1.),vec2(0.,1.),vec2(-1.,1.),vec2(-1.,0.),vec2(-1.,-1.),vec2(0.,-1.),vec2(1.,-1.));
vec2 s=vec2(0.);float ns=0.,d=0.;
for(int r=1;r<=8;r++){if(float(r)>uPad.y+.001)break;
 for(int k=0;k<8;k++){vec2 q=vUv+D[k]*float(r)*uTexel;if(texture(uM,q).x<=WALL){s+=texture(uE,q).xy;ns+=1.;}}
 if(ns>0.){d=float(r);break;}}
if(ns<1.){o=vec4(v,0.,1.);return;}
vec2 H=vec2(uScale.x/uScale.y,1.),ue=uPad.x*(s/ns)*H;float ul=length(ue);if(ul>uPad.z){ue*=uPad.z/ul;ul=uPad.z;}
if(ul<1e-4){o=vec4(v,0.,1.);return;}
vec2 e=ue/ul,vh=v*H;float gap=ul-dot(vh,e);
if(gap>0.)vh+=e*min(gap,ul)*(1.-(d-1.)/uPad.y)*uPad.w;
o=vec4(vh/H,0.,1.);}`;

export const DIV = NB + WALL + `
uniform sampler2D uVel,uM;uniform vec2 uScale;
void main(){if(texture(uM,vUv).x<=WALL){o=vec4(0.,0.,0.,1.);return;}vec2 C=texture(uVel,vUv).xy*uScale;
float L=texture(uVel,vL()).x*uScale.x,R=texture(uVel,vR()).x*uScale.x,T=texture(uVel,vT()).y*uScale.y,B=texture(uVel,vB()).y*uScale.y;
if(vL().x<0.)L=-C.x;if(vR().x>1.)R=-C.x;if(vT().y>1.)T=-C.y;if(vB().y<0.)B=-C.y;
o=vec4(.5*(R-L+T-B),0.,0.,1.);}`;

export const SCALE = `
uniform sampler2D uSrc;uniform float uK;
void main(){o=uK*texture(uSrc,vUv);}`;

export const JACOBI = NB + WALL + `
uniform sampler2D uP,uDiv,uM;
float pn(vec2 q,float c){return texture(uM,q).x>WALL?texture(uP,q).x:c;}
void main(){float C=texture(uP,vUv).x;if(texture(uM,vUv).x<=WALL){o=vec4(C,0.,0.,1.);return;}
float L=pn(vL(),C),R=pn(vR(),C),T=pn(vT(),C),B=pn(vB(),C),d=texture(uDiv,vUv).x;
o=vec4((L+R+B+T-d)*.25,0.,0.,1.);}`;

export const GRAD = NB + WALL + `
uniform sampler2D uP,uVel,uM;uniform vec2 uScale;
float pn(vec2 q,float c){return texture(uM,q).x>WALL?texture(uP,q).x:c;}
void main(){vec2 v=texture(uVel,vUv).xy;if(texture(uM,vUv).x<=WALL){o=vec4(v,0.,1.);return;}
float C=texture(uP,vUv).x,L=pn(vL(),C),R=pn(vR(),C),T=pn(vT(),C),B=pn(vB(),C);
v=v*uScale-vec2(R-L,T-B);
o=vec4(v/uScale,0.,1.);}`;

export const ADVECT = NB + WALL + `
uniform sampler2D uVel,uSrc,uM;uniform float uDt,uDiss,uSlip;
vec4 trace(vec2 c,vec4 own){vec2 sz=1./uTexel;vec2 g=c*sz-.5;vec2 b=floor(g),f=g-b;vec4 a=vec4(0.);float ws=0.;
 for(int j=0;j<2;j++)for(int i=0;i<2;i++){vec2 t=b+vec2(i,j);float w=(i==0?1.-f.x:f.x)*(j==0?1.-f.y:f.y);ivec2 it=clamp(ivec2(t),ivec2(0),ivec2(sz)-1);
  if(texelFetch(uM,it,0).x>WALL){a+=w*texelFetch(uSrc,it,0);ws+=w;}}
 return a+(1.-ws)*own;}
void main(){vec4 own=texture(uSrc,vUv);vec2 c=vUv-uDt*texture(uVel,vUv).xy;
vec4 r=texture(uM,c).x>WALL?(uSlip>.5&&texture(uM,vUv).x>WALL?trace(c,own):texture(uSrc,c)):own;
o=r/(1.+uDiss*uDt);}`;

// The DYE's advection, CONSERVATIVE at the wall (the tester's find: a bilinear back-trace next to the wall blended in the wall's empty
// texels and drained the rim — the edge was a sink). Fluid texel: the back-trace is mask-weighted (the four dye texels round the foot;
// a solid tap's weight reads the texel's own ink — renormalising instead amplified a hot rim texel into its neighbours: a pump), plus the floor, plus EVERY solid neighbour's ink that touches the fluid, split by how many
// fluid neighbours it has. Solid texel: touching the fluid it hands all its ink onto it, so ink the advancing edge sweeps over lands
// on the rim and piles up there; deeper it HOLDS its ink, fading at uFade (a first pass walked it one texel up the mask each step: the
// walks merged into isolated texels and a lobe the set re-grew into came back as salt-and-pepper grain, tester round 3); uSq of it
// reaches the rim (< 1 drained the flickering edge by 1 − uSq a flicker), and uCap bounds a fluid texel (linear ink; past display white).
export const ADYE = NB + `
uniform sampler2D uVel,uSrc,uM;uniform float uDt,uDiss,uFade,uThr,uSq,uCap;uniform vec3 uFloor;
float mk(vec2 q){return texture(uM,q).x;}
bool fl(vec2 q){return mk(q)>uThr;}
vec4 trace(vec2 c,vec4 own){vec2 sz=1./uTexel;vec2 g=c*sz-.5;vec2 b=floor(g),f=g-b;vec4 a=vec4(0.);float ws=0.;
 for(int j=0;j<2;j++)for(int i=0;i<2;i++){vec2 t=b+vec2(i,j);float w=(i==0?1.-f.x:f.x)*(j==0?1.-f.y:f.y);
  if(fl((t+.5)*uTexel)){a+=w*texelFetch(uSrc,clamp(ivec2(t),ivec2(0),ivec2(sz)-1),0);ws+=w;}}
 return a+(1.-ws)*own;}
int nf(vec2 q){vec2 e=vec2(uTexel.x,0.),h=vec2(0.,uTexel.y);return int(fl(q-e))+int(fl(q+e))+int(fl(q-h))+int(fl(q+h));}
void main(){vec4 own=texture(uSrc,vUv);vec2 e=vec2(uTexel.x,0.),h=vec2(0.,uTexel.y);
 vec2 N[4]=vec2[4](vUv-e,vUv+e,vUv-h,vUv+h);vec4 r=vec4(0.);
 if(fl(vUv)){r=trace(vUv-uDt*texture(uVel,vUv).xy,own)/(1.+uDiss*uDt)+vec4(uFloor*uDt,0.);
  for(int k=0;k<4;k++){if(!fl(N[k])){int n=nf(N[k]);if(n>0)r+=uSq*texture(uSrc,N[k])/float(n);}}
  r=min(r,vec4(uCap));}
 else r=nf(vUv)>0?vec4(0.):own*uFade;
 o=r;}`;
