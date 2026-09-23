// OKLCH palette chunk (v0.3 §19, CONTRACTS §1.14) — opt-in GLSL a scene or effect prepends to its own fragment source:
//   ctx.mkProg(ctx.oklch + FS, name)     (HEAD goes first, so TAU and the common uniforms are in scope)
// Functions: linToOkLab / okLabToLin (Ottosson's matrices), srgbToLin / linToSrgb (the piecewise sRGB curve),
// okClip(h, L, C) → the chroma scale the gamut clip keeps (1 = the colour was inside sRGB), palOK(h, L, C) → LINEAR
// sRGB in gamut, palOKs → the same sRGB-encoded (what a scene writes today, before the chain runs in linear light).
// Hue h is a turn (0..1), L 0..1 (0.7 ≈ a light mid-tone), C in OKLab units (0.11 fits every hue at L 0.7 — the
// smoke test proves it). The clip shrinks chroma toward the grey axis at the same L (hue and lightness preserved:
// a clipped colour goes greyer, never darker or hue-shifted, unlike a channel clamp). Never the default palette:
// HEAD's pal() is untouched. assets/math/oklab.js is the JS twin with the same constants.
export const OKLCH_GLSL = `
vec3 linToOkLab(vec3 c){float l=.4122214708*c.r+.5363325363*c.g+.0514459929*c.b;float m=.2119034982*c.r+.6806995451*c.g+.1073969566*c.b;float s=.0883024619*c.r+.2817188376*c.g+.6299787005*c.b;float l_=pow(max(l,0.),1./3.);float m_=pow(max(m,0.),1./3.);float s_=pow(max(s,0.),1./3.);return vec3(.2104542553*l_+.7936177850*m_-.0040720468*s_,1.9779984951*l_-2.4285922050*m_+.4505937099*s_,.0259040371*l_+.7827717662*m_-.8086757660*s_);}
vec3 okLabToLin(vec3 c){float l_=c.x+.3963377774*c.y+.2158037573*c.z;float m_=c.x-.1055613458*c.y-.0638541728*c.z;float s_=c.x-.0894841775*c.y-1.2914855480*c.z;float l=l_*l_*l_;float m=m_*m_*m_;float s=s_*s_*s_;return vec3(4.0767416621*l-3.3077115913*m+.2309699292*s,-1.2684380046*l+2.6097574011*m-.3413193965*s,-.0041960863*l-.7034186147*m+1.7076147010*s);}
vec3 linToSrgb(vec3 c){c=clamp(c,0.,1.);return mix(12.92*c,1.055*pow(c,vec3(1./2.4))-.055,step(.0031308,c));}
vec3 srgbToLin(vec3 c){c=clamp(c,0.,1.);return mix(c/12.92,pow((c+.055)/1.055,vec3(2.4)),step(.04045,c));}
bool okIn(vec3 c){return all(greaterThanEqual(c,vec3(-1e-4)))&&all(lessThanEqual(c,vec3(1.0001)));}
float okClip(float h,float L,float C){vec3 ab=vec3(0.,cos(TAU*h),sin(TAU*h))*C;vec3 g=vec3(L,0.,0.);if(okIn(okLabToLin(g+ab)))return 1.;float lo=0.,hi=1.;for(int i=0;i<14;i++){float t=.5*(lo+hi);if(okIn(okLabToLin(g+ab*t)))lo=t;else hi=t;}return lo;}
vec3 palOK(float h,float L,float C){L=clamp(L,0.,1.);float t=okClip(h,L,C)*C;return clamp(okLabToLin(vec3(L,t*cos(TAU*h),t*sin(TAU*h))),0.,1.);}
vec3 palOKs(float h,float L,float C){return linToSrgb(palOK(h,L,C));}
`;
