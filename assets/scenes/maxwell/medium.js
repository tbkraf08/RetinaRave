// MAXWELL — what the waves travel through. One fragment pass into one RGBA16F/32F texture the size of the field:
//   R = eps (relative permittivity, >= 1)   G = sigma (conductivity: how fast a wave dies)
//   B = the conductor mask 0..1 (1 = a perfect mirror: the E pass multiplies Ez by 1 - mask)   A = spare
//
// Four geometries, picked by MS.sectionAlt mod 4, so a returning section returns to its medium through the director's
// look memory (CONTRACTS §1.11): a LENS (a disc of higher eps, sheared by tension), a MIRROR CAVITY (a ring of
// conductor with two gaps), a PHOTONIC LATTICE (a square grid of eps dots — the band gap makes some wavelengths
// crawl), a WAVEGUIDE (two conducting rails). A section change CROSS-FADES the two geometries over ~1.2 s, which is
// what lets the scene promise `cuts: 'continuous'` while the section is a discrete choice; the conductor is a graded
// mask for the same reason (a hard `if` would cut mid-fade).
//
// The pass is re-rendered every frame: it is one pass against the field's 2*substeps, and a medium that eased its
// numbers only on a threshold would jump. Nothing here is keyed on wall time.
//
// Every number is a named constant. The user retunes here.
import { ABSN, ABSSIG } from './fdtd.js';

export const SIGMAX = 0.035;  // the vacuum's own loss at `ring` = 0. The decay per substep is (1 - a)/(1 + a) with
                              // a = sigma S / 2, so 0.035 is a decay length of ~70 cells and 0.45 was ~5: the first
                              // montage was a glow around each source with no wave in it at all.
export const VACSIG = 0.09;   // arc 'idle' (nothing has started): no geometry, this much loss, the plane just glows.
                              // index.js applies it as the base sigma; uMed.w only switches the GEOMETRY off, so
                              // hooks.medium(4) can pin empty space without also pinning the intro's loss.
export const RLENS = 0.30;    // the lens disc's radius, in units of the grid HEIGHT (the ring of charges is at 0.34)
export const LSOFT = 0.05;    // ... and the width of its edge, so the lens is not a scattering step
export const RCAV = 0.385;    // the mirror cavity's radius
export const TCAV = 0.028;    // ... its wall thickness
export const GAPW = 0.30;     // ... the half-width in radians of each of its two gaps
export const PLAT = 0.082;    // the photonic lattice's period (grid heights) — about two carrier wavelengths
export const RLAT = 0.028;    // ... the radius of one eps dot
export const YGUI = 0.155;    // the waveguide's rails at +- this
export const TGUI = 0.022;    // ... their thickness
export const XGUI = 0.80;     // ... how far along x they run
export const GEON = 4;
export const NAMES = ['lens', 'mirror cavity', 'photonic lattice', 'waveguide'];
export const GEOTC = 1.2;     // a section change cross-fades the two geometries over this many seconds

export const FS_MED = `
uniform vec2 uSz;
uniform vec2 uCtr;
uniform float uHS;        // the grid height in cells: the normalising length, so y runs -0.5 .. 0.5
uniform vec3 uGeo;        // the geometry now, the one before, and the cross-fade 1 -> 0
uniform vec4 uMed;        // eps contrast (params.lens), the lens shear (tension), base sigma, the vacuum mix (arc)
uniform vec2 uMir;        // the drop's mirror 0..1, and the geometry's own rotation (sectionAlt)
float sm(float e, float x) { return 1.0 - smoothstep(0.0, e, x); }   // 1 inside, 0 outside, over a width e
// one geometry: eps mask (x) and conductor mask (y), in grid-height units around the centre
vec2 geo(int k, vec2 u, float shear) {
  if (k == 0) {
    vec2 v = vec2(u.x + shear * u.y, u.y * (1.0 - 0.25 * shear));
    return vec2(sm(${LSOFT.toFixed(3)}, length(v) - ${RLENS.toFixed(3)}), 0.0);
  }
  if (k == 1) {
    float r = length(u), a = atan(u.y, u.x);
    float wall = sm(0.004, abs(r - ${RCAV.toFixed(3)}) - ${TCAV.toFixed(3)});
    float gap = max(sm(0.04, abs(a) - ${GAPW.toFixed(3)}), sm(0.04, abs(abs(a) - 3.14159265) - ${GAPW.toFixed(3)}));
    return vec2(0.0, wall * (1.0 - gap));
  }
  if (k == 2) {
    vec2 c = (fract(u / ${PLAT.toFixed(4)} + 0.5) - 0.5) * ${PLAT.toFixed(4)};
    return vec2(sm(0.008, length(c) - ${RLAT.toFixed(3)}), 0.0);
  }
  float rail = sm(0.004, abs(abs(u.y) - ${YGUI.toFixed(3)}) - ${TGUI.toFixed(3)}) * sm(0.05, abs(u.x) - ${XGUI.toFixed(3)});
  return vec2(0.0, rail);
}
void main() {
  vec2 q = gl_FragCoord.xy;
  vec2 u = (q - uCtr) / uHS;
  float cs = cos(uMir.y), sn = sin(uMir.y);
  u = mat2(cs, -sn, sn, cs) * u;
  vec2 a = geo(int(uGeo.x + 0.5), u, uMed.y);
  vec2 b = geo(int(uGeo.y + 0.5), u, uMed.y);
  vec2 g = mix(b, a, uGeo.z);
  g *= 1.0 - uMed.w;                                   // the intro is vacuum: no geometry at all
  // the graded absorber: sigma ramps quadratically over the outermost cells. On the drop it stops absorbing and
  // becomes the conductor instead — the walls turn into mirrors and the field stands (the plan's dropEnv).
  float d = min(min(q.x, q.y), min(uSz.x - 1.0 - q.x, uSz.y - 1.0 - q.y));
  float t = max(0.0, (${ABSN.toFixed(1)} - d) / ${ABSN.toFixed(1)});
  float abs0 = ${ABSSIG.toFixed(3)} * t * t;
  float eps = 1.0 + (uMed.x - 1.0) * g.x;
  float sig = uMed.z + abs0 * (1.0 - uMir.x);
  float mir = max(g.y, uMir.x * smoothstep(0.0, 0.35, t));
  o = vec4(eps, sig, clamp(mir, 0.0, 1.0), 0.0);
}
`;
