// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// Solver after Pavel Dobryakov, WebGL-Fluid-Simulation (MIT, 2017) — https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
// after GPU Gems ch. 38 (Harris 2004)
// FLUID's GLSL (FLUID-PLAN Step 3, DECISIONS §106): ONE fullscreen pass over the substrate's dye. The dye is linear ink at
// the dye grid's resolution (ctx.engineTex.dye, RGBA16F); this pass lights it as a liquid surface — the normal is taken from
// the ink's luminance gradient over ±2 dye texels (Dobryakov's SHADING idea: a height field read off the dye), lit from the
// top with a Lambert term and a tight Blinn highlight, over a dark pool — then feathers the frame to a rounded porthole so
// the solver's closed walls never show (CONTRACTS §1.10's rule), and ENCODES (linToSrgb from ctx.oklch: the chain decodes
// once at its input, §1.10). Prepend ctx.oklch. Nothing here is copied from the reference; the idea is credited above.
//   uDye        the substrate's dye (1×1 black while the substrate is off: the pool is empty and uLook.w says so)
//   uDyeTexel   1 / the dye grid (the gradient's step)
//   uLook       x exposure (the track's own loudness ladder, index.js) · y highlight gain · z relief (the gradient's gain) · w idle 0/1
//   uPort       the porthole feather's inner / outer radius on the superellipse |x|⁴ + |y|⁴ = r⁴ of the frame
export const SHOW_FS = `
uniform sampler2D uDye;uniform vec2 uDyeTexel,uPort;uniform vec4 uLook;
float lum(vec3 c){return dot(c,vec3(.2126,.7152,.0722));}
void main(){
  vec2 uv=vUv;float asp=uRes.x/uRes.y;vec2 e=2.*uDyeTexel;   // the gradient over ±2 dye texels: a mild blur of the dye's grain (DECISIONS §104)
  vec3 c=max(texture(uDye,uv).rgb,0.);
  float L=lum(texture(uDye,uv-vec2(e.x,0.)).rgb),R=lum(texture(uDye,uv+vec2(e.x,0.)).rgb);
  float B=lum(texture(uDye,uv-vec2(0.,e.y)).rgb),T=lum(texture(uDye,uv+vec2(0.,e.y)).rgb);
  // the surface: ink is height, so a brighter neighbour tilts the normal away from it; relief scales the slope
  vec3 n=normalize(vec3(-(R-L)*uLook.z,-(T-B)*uLook.z,1.));
  vec3 l=normalize(vec3(0.,.55,.83));            // the light, from the top of the frame
  vec3 h=normalize(l+vec3(0.,0.,1.));             // the half vector to a viewer straight above
  float dif=.35+.65*clamp(dot(n,l),0.,1.);
  float ink=clamp(lum(c)*4.,0.,1.);               // how much ink is here: the highlight rides the ink, not the empty pool
  float spec=pow(max(dot(n,h),0.),48.)*uLook.y*(.08+.92*ink);
  vec3 pool=vec3(.0012,.002,.0045);               // the dark pool, a hint of blue (linear: the chain's tonemap lifts the floor ×1.9)
  vec3 col=pool+c*dif+spec*vec3(.9,.95,1.);
  // the porthole: a superellipse of the frame, feathered between uPort.x and uPort.y — the walls stay outside the picture
  vec2 p=(uv-.5)*2.;float r=pow(pow(abs(p.x),4.)+pow(abs(p.y),4.),.25);
  float port=1.-smoothstep(uPort.x,uPort.y,r);
  // idle (no float render targets, or the substrate switched off): the empty pool's surface, faint rings on musical time
  float rr=length(p*vec2(asp,1.));
  col+=uLook.w*vec3(.012,.02,.034)*(.5+.5*sin(26.*rr-1.6*uTime))*(1.-smoothstep(.2,1.6,rr));
  col*=uLook.x*port;
  o=vec4(linToSrgb(clamp(col,0.,1.)),1.);
}`;
