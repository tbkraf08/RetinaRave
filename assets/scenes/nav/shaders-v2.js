// NAV shaders, colour mapping `v2` (CONTRACTS §1.4) — v0.2's Julia and PiP fragment sources, lifted verbatim, and
// the scene's DEFAULT: the look the user chose (DECISIONS §26). The OKLCH mapping of §25 is in shaders.js and is
// opt-in (`&colour=oklch`). Nothing below has changed since v0.2 but the two export names — in particular there is
// no uClipDbg here (the gamut probe belongs to the OKLCH pass) and no ctx.oklch / OK_NAV chunk in front of it.
// VS_PT / FS_PT are the same under both mappings, so they stay in shaders.js and are not duplicated here.

// The Julia set of f_c. Exterior: distance-estimated dust with orbit traps; interior with a known cycle (uLam.w):
// Koenigs coordinate bands + spokes, and the DRUM: Koopman modes cos(k·arg + TAU·m·L) driven by the spectral peaks.
// Both interior branches carry the critical-slowing smoulder: uPar (NAV's N.par, the multiplier modulus |lambda| ->
// 1 near a parabolic root) squared, so the term is exactly zero while par is 0 and the picture is byte-identical to v3.
export const FS_JULIA_V2 = `
uniform vec2 uC;uniform vec4 uView;uniform int uIter;uniform vec2 uTrapN;uniform float uTrapR;uniform float uDrum;uniform vec2 uZs;uniform vec4 uLam;uniform float uEps2;uniform vec4 uMode[4];uniform float uPx;uniform float uPar;uniform vec2 uSc; // z-scale of the (little) Julia set, 1/P
void main(){
  vec2 p=(vUv*2.-1.)*vec2(uRes.x/uRes.y,1.);vec2 z=uView.xy+uView.z*(rot(uView.w)*p);
  vec2 dz=vec2(1.,0.);float m2=dot(z,z),tL=1e9,tC=1e9,n=0.;bool esc=false,conv=false,big=false;
  for(int i=0;i<420;i++){ if(i>=uIter)break;
    if(!big){dz=2.*cmul(z,dz);if(dot(dz,dz)>1e30)big=true;}
    z=vec2(z.x*z.x-z.y*z.y,2.*z.x*z.y)+uC;m2=dot(z,z);n+=1.;
    tL=min(tL,abs(dot(z,uTrapN)));tC=min(tC,abs(sqrt(m2)-uTrapR));
    if(m2>1e4){esc=true;break;}
    if(uLam.w>.5){vec2 w=z-uZs;if(dot(w,w)<uEps2){conv=true;break;}}
  }
  float lt=exp(-tL*16./uSc.x),ct=exp(-tC*22.);vec3 col;
  if(esc){
    float sn=n+1.-log2(max(1e-6,.5*log(m2)/log(100.)));
    float d=big?0.:.5*sqrt(m2/dot(dz,dz))*log(m2);float e=d/uPx;
    float edge=exp(-e*.3),halo=1./(1.+e*.011);float t=sn*.035*uSc.y+uTime*.06+.12*sin(atan(z.y,z.x)*2.);
    col=pal(t)*(.07+.93*halo*halo);
    col+=pal(t+.35)*lt*(.25+1.2*uBands.x)*halo;col+=pal(t+.2)*exp(-d*7./uSc.x)*(.05+.6*uBeat.w); /* dust stays legible when c is far outside M */ col+=pal(t+.6)*ct*uBands.z*.9*halo;
    col=mix(col,mix(vec3(1.),pal(t+.2)*2.,.6)*uPal.w,edge*(.3+.4*uBeat.y));
  }else if(conv){
    vec2 w=z-uZs;float Lw=.5*log(max(dot(w,w),1e-20));float aw=atan(w.y,w.x);float lnr=min(uLam.x,-.05);
    float Lk=Lw/(-lnr)+n/uLam.z;float ai=aw-uLam.y*(Lw/lnr); // Koenigs coordinate: both are invariants of f^q
    float bands=.5+.5*cos(TAU*Lk);float spokes=.5+.5*cos(ai*2.+uTime*.4);
    vec3 base=pal(.55+.1*bands+.08*spokes)*(.03+.16*bands*(.3+uBands.x)+.05*spokes);
    float psi=0.,at=0.;for(int j=0;j<4;j++){vec4 M=uMode[j];psi+=M.z*cos(M.x*ai+TAU*M.y*Lk)*cos(M.w);at+=M.z;}
    float chl=exp(-abs(psi)*7.);vec3 drum=pal(.3+.3*psi)*(.06+.7*abs(psi))+vec3(1.,.95,.85)*chl*.55*min(at,1.)*uPal.w;
    col=mix(base,drum,uDrum)+pal(.8)*lt*.15;
    col+=pal(.5+.1*bands)*uPar*uPar*(.35+.3*uBands.x)*(.3+.7*bands); /* critical slowing: the bands smoulder as |lambda|->1 */
  }else{col=pal(.6)*.03+pal(.4)*lt*.25*(.3+uBands.x);col+=pal(.45)*uPar*uPar*(.16+.2*uBands.x);}
  o=vec4(col,1.);
}`;

// Picture-in-picture: M itself with the path of c (drawn in-shader from uPath — gl.POINTS vanish in offset viewports on ANGLE-GL).
export const FS_MANDEL_V2 = `
uniform vec4 uView;uniform int uIter;uniform float uAlpha;uniform vec3 uPath[32];uniform vec3 uPc;
float seg(vec2 p,vec2 a,vec2 b){vec2 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/max(dot(ba,ba),1e-12),0.,1.);return length(pa-ba*h);}
void main(){vec2 p=vUv*2.-1.;vec2 c=uView.xy+uView.z*p;vec2 z=vec2(0.),dz=vec2(0.);float n=0.,m2=0.;bool esc=false;
  for(int i=0;i<256;i++){if(i>=uIter)break;dz=2.*cmul(z,dz)+vec2(1.,0.);z=vec2(z.x*z.x-z.y*z.y,2.*z.x*z.y)+c;m2=dot(z,z);n+=1.;if(m2>1e4){esc=true;break;}}
  vec3 col=vec3(.0);if(esc){float d=.5*sqrt(m2/dot(dz,dz))*log(m2);float e=d/(uView.z*2./uRes.y);float sn=n+1.-log2(.5*log(m2)/log(100.));
    col=pal(sn*.03+.2)*.35/(1.+e*.05)+vec3(.9)*exp(-e*.6);}else col=vec3(.02,.02,.04);
  float pg=0.;for(int j=0;j<31;j++){float d=seg(c,uPath[j].xy,uPath[j+1].xy)/uView.z;pg+=(exp(-d*70.)+.35*exp(-d*14.))*uPath[j].z;}
  float dc=length(c-uPath[0].xy)/uView.z;float cur=exp(-dc*28.)+.5*exp(-dc*7.);col+=uPc*min(pg,1.5)+vec3(1.)*cur*uPath[0].z;
  float r=length(max(abs(p)-vec2(.82),0.))/.18;float a=uAlpha*(1.-smoothstep(.6,1.,r));o=vec4(col,a*clamp((esc?.85:.7)+pg+cur,0.,1.));}`;
