// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// NAV shaders. Fragment sources get HEAD (uRes uTime uBands uBeat uArc uHarm uPal uTint, pal/cmul/rot/hash) prepended
// by ctx.mkProg, then ctx.oklch (CONTRACTS §1.14: palOK/palOKs/okClip) and OK_NAV below. Lifted from cardioid3
// FS.julia / FS.mandel / VS_PT / FS_PT; the colour of both escape branches is now OKLCH (v0.3 items 5 + 6).

// The gamut envelope: a lower bound, over all hues, of the OKLCH max chroma at lightness L. The true min-over-hue
// curve (the tightest hue is 200 deg below L .78, 268 deg above it) is bracketed by min(.17 L, .47 (1-L)) to within
// 4.3 %, so .95x that is inside sRGB at EVERY hue and lightness -- checked on a 200x720 (L, hue) grid against
// Ottosson's matrices. cMax(.7) = .113, i.e. the .11 of §1.14, so `cMax(L) * x` is that section's `.11 * x` at L .7
// and shrinks where the gamut does. With C capped this way palOK never clips: hooks.clipdbg=1 is 1.0 on every pixel.
// K_SN: hue turns per unit of the smooth escape count, i.e. per doubling of the potential of J_c (and of M in the
// PiP). One turn per five doublings draws four or five complete rings around a lobe -- a contour map, not a stripe
// pattern (`tools/work/hue-set-nav.jpg`, docs/workers/hue-follows-set.md §2).
export const OK_NAV = `
float cMax(float L){return .95*min(.17*L,.47*(1.-L));}
const float K_SN=.2;
`;

// The Julia set of f_c. Exterior: distance-estimated dust with orbit traps, HUE = the SMOOTH ESCAPE COUNT, K_SN
// turns per unit -- so iso-hue is an equipotential of J_c, a closed curve around the filled set, and the colour
// follows the shape. It used to be the external angle, accumulated per iteration from the binary itinerary (v0.3
// item 5); the montage `tools/work/hue-set-nav.jpg` is why it is not: the angle's level sets are enormous radial
// sectors whose seams run straight THROUGH the set's own lobes (at f840 each blob came out half teal, half amber),
// which is the user's "the colours don't match up with the set". The escape count wraps every lobe in concentric
// rings instead. Lightness is capped at .5 and the chroma is the full cMax(L) there, so the rings read as colour on
// a dark field. NOTHING reads the itinerary any more, so its per-iteration accumulation is gone from the loop and
// from the PiP's (v0.3 §25's derivation stays in DECISIONS §25 and `docs/workers/nav-hue.md`, and the four lines are
// one revision away). Interior with a known cycle (uLam.w): HUE =
// arg lambda / TAU (the component's internal angle, the rotation number's direction), LIGHTNESS = |lambda| (a centre
// is dark, a root or a cusp bright), Koenigs bands on both and the spokes on chroma, and the DRUM: Koopman modes
// cos(k arg + TAU m L) driven by the spectral peaks. Both interior branches carry the critical-slowing smoulder:
// uPar (NAV's N.par, the multiplier modulus |lambda| -> 1 near a parabolic root) squared, added after the DRUM mix
// so the membrane keeps it, and exactly zero while par is 0. The loop's split budget (uIterLo) is shaders-v2.js's,
// line for line — the two mappings share one loop and must keep sharing it.
export const FS_JULIA = `
uniform vec2 uC;uniform vec4 uView;uniform int uIter;uniform vec2 uTrapN;uniform float uTrapR;uniform float uDrum;uniform vec2 uZs;uniform vec4 uLam;uniform float uEps2;uniform vec4 uMode[4];uniform float uPx;uniform float uPar;uniform int uIterLo;uniform vec2 uSc;uniform float uClipDbg; // uSc: z-scale of the (little) Julia set, 1/P
void main(){
  vec2 p=(vUv*2.-1.)*vec2(uRes.x/uRes.y,1.);vec2 z=uView.xy+uView.z*(rot(uView.w)*p);
  vec2 dz=vec2(1.,0.);float m2=dot(z,z),tL=1e9,tC=1e9,n=0.;bool esc=false,conv=false,big=false;
  for(int i=0;i<420;i++){ if(i>=uIter)break;
    float dd=1e31;
    if(!big){dz=2.*cmul(z,dz);dd=dot(dz,dz);if(dd>1e30)big=true;}
    z=vec2(z.x*z.x-z.y*z.y,2.*z.x*z.y)+uC;m2=dot(z,z);n+=1.;
    tL=min(tL,abs(dot(z,uTrapN)));tC=min(tC,abs(sqrt(m2)-uTrapR));
    if(m2>1e4){esc=true;break;}
    if(uLam.w>.5){vec2 w=z-uZs;if(dot(w,w)<uEps2){conv=true;break;}}
    else if(i>=uIterLo&&dd<1.)break; // no chart: the long budget is for structure still resolving, and |(f^n)'|<1 says there is none left
  }
  float lt=exp(-tL*16./uSc.x),ct=exp(-tC*22.);vec3 col;vec4 hlc=vec4(0.,1.,0.,0.); // hlc = the (h, L, C, C asked for) of this pixel
  if(esc){
    float sn=n+1.-log2(max(1e-6,.5*log(m2)/log(100.)));
    float d=big?0.:.5*sqrt(m2/dot(dz,dz))*log(m2);float e=d/uPx;
    float edge=exp(-e*.3),halo=1./(1.+e*.011),fl=edge*(.3+.4*uBeat.y);
    float gb=.5+.5*cos(TAU*(sn*.035*uSc.y+uTime*.06+.12*sin(atan(z.y,z.x)*2.))); /* Green's equipotential bands: today's exterior ripple, on L and C now */
    float lw=((.07+.93*halo*halo)*(.28+.72*gb)+lt*(.25+1.2*uBands.x)*halo+exp(-d*7./uSc.x)*(.05+.6*uBeat.w)+ct*uBands.z*.9*halo);
    float cs=.55+.45*gb;
    float L=min(.55*pow(clamp(lw,0.,1.),.73),.5); /* .73 = 1/3 of the 2.2 gamma; the .5 cap keeps L where cMax is wide, so the rings stay saturated on a dark field */
    hlc=vec4(sn*K_SN*uSc.y+uPal.x,L,cMax(L),.11*cs); /* hue = the equipotential (uSc.y = 1/P: a baby copy's rings are as wide as its host's); w = the flat .11 counterfactual hooks.clipdbg=2 reads */
    col=palOKs(hlc.x,hlc.y,hlc.z)+vec3(1.)*fl*.45*uPal.w; /* the boundary flash is additive now, outside the OKLCH request */
  }else if(conv){
    vec2 w=z-uZs;float Lw=.5*log(max(dot(w,w),1e-20));float aw=atan(w.y,w.x);float lnr=min(uLam.x,-.05);
    float Lk=Lw/(-lnr)+n/uLam.z;float ai=aw-uLam.y*(Lw/lnr); // Koenigs coordinate: both are invariants of f^q
    float bands=.5+.5*cos(TAU*Lk);float spokes=.5+.5*cos(ai*2.+uTime*.4);float bm=.6+.4*bands;
    float L=clamp((.10+.32*exp(uLam.x))*bm,0.,.92); /* |lambda| -> L: a centre dark, a root a lit mid-tone, and low enough for the chroma to survive */
    float cs=bm*(.88+.12*spokes); /* the spokes are a chroma modulation now, not a brightness one */
    hlc=vec4(uLam.y/TAU+uPal.x,L,cMax(L)*cs,.11*cs);
    vec3 base=palOKs(hlc.x,hlc.y,hlc.z);
    float psi=0.,at=0.;for(int j=0;j<4;j++){vec4 M=uMode[j];psi+=M.z*cos(M.x*ai+TAU*M.y*Lk)*cos(M.w);at+=M.z;}
    float chl=exp(-abs(psi)*7.);vec3 drum=pal(.3+.3*psi)*(.06+.7*abs(psi))+vec3(1.,.95,.85)*chl*.55*min(at,1.)*uPal.w;
    col=mix(base,drum,uDrum)+pal(.8)*lt*.15;
    col+=pal(.5+.1*bands)*uPar*uPar*(.35+.3*uBands.x)*(.3+.7*bands); /* critical slowing: additive, outside the mix, so DRUM keeps it */
  }else{
    float lw=.6*(.03+lt*.25*(.3+uBands.x));
    float L=clamp(pow(clamp(lw,0.,1.),.73),0.,.25);float cs=.4;
    hlc=vec4(uPal.x+.5,L,cMax(L)*cs,.11*cs); /* no cycle known: the mood hue's complement at low chroma */
    col=palOKs(hlc.x,hlc.y,hlc.z)+pal(.45)*uPar*uPar*(.16+.2*uBands.x);
  }
  if(uClipDbg>.5){o=vec4(okClip(hlc.x,hlc.y,uClipDbg>1.5?hlc.w:hlc.z),1.,1.,1.);return;} /* #test gamut probe */
  o=vec4(col,1.);
}`;

// Picture-in-picture: M itself with the path of c (drawn in-shader from uPath — gl.POINTS vanish in offset viewports
// on ANGLE-GL). Its exterior takes the same smooth-escape-count hue as the main view, with the same uPal.x offset
// and the same K_SN (no uSc: the PiP is always the host M at scale 1), so the two views share one rule — the
// ray-matching rationale of v0.3 item 6 went with the external angle.
export const FS_MANDEL = `
uniform vec4 uView;uniform int uIter;uniform float uAlpha;uniform vec3 uPath[32];uniform vec3 uPc;uniform float uClipDbg;
float seg(vec2 p,vec2 a,vec2 b){vec2 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/max(dot(ba,ba),1e-12),0.,1.);return length(pa-ba*h);}
void main(){vec2 p=vUv*2.-1.;vec2 c=uView.xy+uView.z*p;vec2 z=vec2(0.),dz=vec2(0.);float n=0.,m2=0.;bool esc=false;
  for(int i=0;i<256;i++){if(i>=uIter)break;dz=2.*cmul(z,dz)+vec2(1.,0.);z=vec2(z.x*z.x-z.y*z.y,2.*z.x*z.y)+c;m2=dot(z,z);n+=1.;if(m2>1e4){esc=true;break;}}
  vec3 col=vec3(.0);vec4 hlc=vec4(0.,1.,0.,0.);
  if(esc){float d=.5*sqrt(m2/dot(dz,dz))*log(m2);float e=d/(uView.z*2./uRes.y);float sn=n+1.-log2(.5*log(m2)/log(100.));
    float gb=.5+.5*cos(TAU*sn*.03),lw=.35/(1.+e*.05)*(.35+.65*gb),cs=.55+.45*gb;
    float L=.55*pow(clamp(lw,0.,1.),.73); /* the PiP keeps its own lightness and chroma; only the hue rule is shared */
    hlc=vec4(sn*K_SN+uPal.x,L,cMax(L)*cs,.11*cs);
    col=palOKs(hlc.x,hlc.y,hlc.z)+vec3(.9)*exp(-e*.6);}else col=vec3(.02,.02,.04);
  if(uClipDbg>.5){o=vec4(okClip(hlc.x,hlc.y,uClipDbg>1.5?hlc.w:hlc.z),1.,1.,1.);return;}
  float pg=0.;for(int j=0;j<31;j++){float d=seg(c,uPath[j].xy,uPath[j+1].xy)/uView.z;pg+=(exp(-d*70.)+.35*exp(-d*14.))*uPath[j].z;}
  float dc=length(c-uPath[0].xy)/uView.z;float cur=exp(-dc*28.)+.5*exp(-dc*7.);col+=uPc*min(pg,1.5)+vec3(1.)*cur*uPath[0].z;
  float r=length(max(abs(p)-vec2(.82),0.))/.18;float a=uAlpha*(1.-smoothstep(.6,1.,r));o=vec4(col,a*clamp((esc?.85:.7)+pg+cur,0.,1.));}`;

// Critical orbit points (additive).
export const VS_PT = `#version 300 es
layout(location=0) in vec3 aP;uniform vec4 uView;uniform float uAsp;uniform float uSize;out float vA;
void main(){vec2 d=aP.xy-uView.xy;float c=cos(uView.w),s=sin(uView.w);vec2 p=vec2(c*d.x+s*d.y,-s*d.x+c*d.y)/uView.z;vA=aP.z;gl_Position=vec4(p.x/uAsp,p.y,0.,1.);gl_PointSize=uSize*(.4+aP.z);}`;
export const FS_PT = `#version 300 es
precision highp float;in float vA;out vec4 o;uniform vec3 uCol;uniform float uLine;
void main(){float g=1.;if(uLine<.5){vec2 q=gl_PointCoord*2.-1.;float r=dot(q,q);g=exp(-r*4.)*(1.-smoothstep(.8,1.,r));}o=vec4(uCol*vA*g,vA*g);}`;
