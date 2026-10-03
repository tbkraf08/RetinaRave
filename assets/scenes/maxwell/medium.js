// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// MAXWELL — what the waves travel through. One fragment pass into one RGBA16F/32F texture the size of the field:
//   R = eps (relative permittivity, >= 1)   G = sigma (conductivity: how fast a wave dies)
//   B = the conductor mask 0..1 (1 = a perfect mirror: the E pass multiplies Ez by 1 - mask)   A = spare
//
// TWO geometries are in ROTATION, picked by MS.sectionAlt mod GEOROT, so a returning section returns to its medium
// through the director's look memory (CONTRACTS §1.11): a LENS (a disc of higher eps, sheared by tension) and a
// MIRROR CAVITY (a ring of conductor with two gaps). A section change CROSS-FADES the two over ~1.2 s, which is what
// lets the scene promise `cuts: 'continuous'` while the section is a discrete choice; the conductor is a graded mask
// for the same reason (a hard `if` would cut mid-fade).
//
// v0.12 item C — the user, on v0.11: "why are there a pattern of small circles in the background?". That was the
// PHOTONIC LATTICE (a square grid of eps dots, every fourth section), and it is REMOVED: slot 2 is empty space, so
// hooks.medium(2) pins a control and can never draw a lattice again. The WAVEGUIDE (two conducting rails) survives
// at slot 3 but is OUT of rotation — reachable only by hooks.medium(3), for one montage shot, until the user has
// seen sound-only ripples in the cavity and decided its fate. The drop's mirror (MIRQ, 2.2 s hold) is untouched.
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
// The picture is a round PORTHOLE of the plane: render.js fades it to black over the absorber's own width, so the
// grid's rectangle is never seen and the yawing camera has no corners to sweep. The geometry is sized against that
// disc — radius half a grid height, less the absorber.
export const RLENS = 0.30;    // the lens disc's radius, in units of the grid HEIGHT (the ring of charges is at 0.34)
export const LSOFT = 0.05;    // ... and the width of its edge, so the lens is not a scattering step
export const RCAV = 0.385;    // the mirror cavity's radius
export const TCAV = 0.028;    // ... its wall thickness
export const GAPW = 0.30;     // ... the half-width in radians of each of its two gaps
export const YGUI = 0.155;    // the waveguide's rails at +- this
export const TGUI = 0.022;    // ... their thickness
export const XGUI = 0.80;     // ... how far along x they run
export const GEON = 4;        // the geometry SLOTS hooks.medium(v) can pin: 0 lens · 1 cavity · 2 empty · 3 waveguide
export const GEOROT = 2;      // ... and how many of them the section rotates through: the lens and the cavity only
export const NAMES = ['lens', 'mirror cavity', 'empty space', 'waveguide'];
export const GEOTC = 1.2;     // a section change cross-fades the two geometries over this many seconds
export const WOBR = 0.50;     // the wobble's radius in grid heights: the whole porthole, strongest at the centre
export const MIRQ = 1.00;     // the drop's mirror takes the BULK loss away too, all of it: with the mirror full on
                              // the plane is closed AND lossless, and the field really stands. Without this the drop
                              // changed almost nothing — at the loss the music asks for, a wave is down to a tenth
                              // of itself before it ever reaches the absorber, so turning the absorber into a mirror
                              // was turning a mirror on behind a curtain.

export const FS_MED = `
uniform vec2 uSz;
uniform vec2 uCtr;
uniform float uHS;        // the grid height in cells: the normalising length, so y runs -0.5 .. 0.5
uniform vec3 uGeo;        // the geometry now, the one before, and the cross-fade 1 -> 0
uniform vec4 uMed;        // eps contrast (params.lens), the lens shear (tension), base sigma, the vacuum mix (arc)
uniform vec2 uMir;        // the drop's mirror 0..1, and the geometry's own rotation (sectionAlt)
uniform float uWob;       // the wobble (v0.11 item 3), applied over WOBR with a raised-cosine profile: strongest at
                          // the centre, nothing at the rim. It has to be GRADED. A perfectly UNIFORM eps(t) leaves
                          // every plane wave an eigenmode with its k unchanged — only the frequency moves — so a
                          // uniform breath cannot bunch a ring that is already in flight (measured: the crest
                          // spacing moved 4 % over a full 2 Hz cycle at eps 0.74 -> 1.26). A GRADED one is a lens
                          // that breathes: the middle of the cavity slows while the rim does not, the fronts bend
                          // as they cross it, and the ripple visibly squeezes and relaxes at the wobble rate.
                          // index.js clamps uWob into [WOBLO, WOBHI] so S / sqrt(eps) never leaves the Courant limit.
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
  if (k == 2) return vec2(0.0, 0.0);   // slot 2 is EMPTY SPACE (item C: the photonic lattice was here and is gone)
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
  float wr = clamp(length(u) / ${WOBR.toFixed(3)}, 0.0, 1.0);
  float eps = (1.0 + (uMed.x - 1.0) * g.x) * (1.0 + (uWob - 1.0) * (0.5 + 0.5 * cos(3.14159265 * wr)));
  float sig = uMed.z * (1.0 - ${MIRQ.toFixed(2)} * uMir.x) + abs0 * (1.0 - uMir.x);
  // The drop's mirror is a SHELL about a cell and a half thick at the very edge, not the whole absorber band. A
  // conductor is Ez = 0, so a thick one destroys the Ez of everything that enters it: with the whole 16-cell band
  // turned to conductor the "lossless" cavity lost a third of its energy in two seconds; a three-cell shell lost
  // 6 % and a sub-cell one 9 % (too thin to reflect — the wave tunnels it). A mirror is a surface.
  float mir = max(g.y, uMir.x * smoothstep(0.90, 0.99, t));
  o = vec4(eps, sig, clamp(mir, 0.0, 1.0), 0.0);
}
`;
