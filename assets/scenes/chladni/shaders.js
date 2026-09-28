// CHLADNI's GLSL. The plate is not geometry: every pixel casts one ray from the scene's camera and intersects the
// plane z = 0, so the plate is exact at any elevation and the whole pass is one ctx.tri(). The figure comes from
// math/chladni.js's GLSL twin (`chField`, `chIn`), prepended below, so the shader and the node test share one table.
//
// palC() is the repo's cosine palette (HEAD's pal() is driven by LOOK.pal; this scene wants the anchored hue of
// math/keycolour.js instead, plus a per-note hue offset), written exactly as torus2/shaders.js's palM.

import { GLSL as CH } from '../../math/chladni.js';

// The plate pass's own leans, named here because this is the module they act in.
const LEANS = `
#define CH_ANTI 0.80       // how bright the antinodes (the parts that MOVE) are against the nodal lines
#define CH_EDGE 0.10       // the porthole: how wide the plate's edge is feathered (CONTRACTS 1.10)
#define CH_RIPF 6.0        // how fast a hat ripple dies, per second of hatAge
#define CH_RIPW 34.0       // and how fast it travels outward
#define CH_SNW 40.0        // the snare's ring: 1 / (its width)^2
#define CH_VOID 0.18       // the soft mid light that is all the void has
#define CH_SANDL 90.0      // how tightly a grain must sit on a line to be lit as ON it
`;

// the palette, and the plate's ray cast — shared by the plate pass and the sand's draw pass
const COMMON = `
uniform vec3 uMood;        // the anchored hue / saturation / brightness (math/keycolour.js on the tonic)
vec3 palC(float t) {
  vec3 c = 0.5 + 0.5 * cos(TAU * (uMood.x + t + vec3(0.0, 0.33, 0.67)));
  c = pow(c, vec3(1.7));
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  return mix(vec3(l), c, uMood.y) * uMood.z;
}
`;

export const PLATE_FS = CH + LEANS + COMMON + `
uniform vec3 uEye;         // the camera position
uniform mat3 uCamB;        // its basis: column 0 = right, 1 = up, 2 = forward
uniform vec2 uLens;        // focal length (1 / tan(fov / 2)), aspect
uniform vec4 uFig;         // s (fractional interval), h (harmonic content), bnd (0 square, 1 round), line width
uniform vec4 uDyn;         // amplitude, nodal-line glow, the hat ripple's depth, the snare flash
uniform vec4 uHue;         // the sub note's hue offset, the antinode hue offset, fog, the void's lift
uniform vec3 uRip;         // the hat ripple: age (s), radial wavenumber, the snare flash's ring radius

// A ray through pixel sc in [-1, 1]^2 (x already scaled by the aspect), hitting the plate plane z = 0.
// Returns the plate point in w = 1, or w = 0 when the ray never reaches the plane.
vec3 plateHit(vec2 sc) {
  vec3 rd = normalize(uCamB * vec3(sc.x, sc.y, uLens.x));
  float t = -uEye.z / (abs(rd.z) < 1e-5 ? (rd.z < 0.0 ? -1e-5 : 1e-5) : rd.z);
  if (t <= 0.0) return vec3(0.0, 0.0, 0.0);
  vec3 q = uEye + t * rd;
  return vec3(q.xy, 1.0);
}

void main() {
  vec2 sc = vUv * 2.0 - 1.0;
  sc.x *= uLens.y;
  vec3 hit = plateHit(sc);
  // the background: a dark floor that lets the plate read, with the fog lifting it as the low-pass closes
  vec3 bg = mix(vec3(0.004, 0.006, 0.012), palC(0.5) * 0.06, uHue.z);
  if (hit.z < 0.5) { o = vec4(bg, 1.0); return; }
  vec2 p = hit.xy;
  float din = chIn(p, uFig.z);
  if (din <= 0.0) { o = vec4(bg, 1.0); return; }
  float u = chField(p, uFig.x, uFig.y, uFig.z);
  // the fine high-mode ripple a hat sends across the surface: the "skinnier waves" of 50-57 s, a travelling
  // wave in the plate radius on heard time, so it is placed by hatAge and dies with it
  float r = length(p);
  float rip = uDyn.z * exp(-uRip.x * CH_RIPF) * sin(uRip.y * r - uRip.x * CH_RIPW);
  u += rip;
  // the nodal glow: exp(-(u/w)^2) is 1 on the line and falls off in one line width, so a figure change reads
  // instantly, before a single grain of sand has moved
  float wl = uFig.w * (1.0 + 0.6 * uDyn.x);
  float g = exp(-(u / wl) * (u / wl));
  // the antinodes: where the plate is really moving. |u|^2 weighted by the drive, so a silent plate is dark
  float anti = u * u;
  // the snare's flash: one bright ring crossing the plate
  float sn = uDyn.w * exp(-CH_SNW * (r - uRip.z) * (r - uRip.z));
  vec3 col = palC(uHue.x) * (g * uDyn.y) + palC(uHue.x + uHue.y) * (anti * uDyn.x * CH_ANTI) + palC(uHue.x + 0.5) * sn;
  col += palC(uHue.x + 0.25) * uHue.w * CH_VOID * (0.4 + 0.6 * g);   // the void's soft mid light
  col *= smoothstep(0.0, CH_EDGE, din);                              // the porthole: feather the plate's edge (CONTRACTS 1.10)
  col = mix(col, vec3(dot(col, vec3(0.299, 0.587, 0.114))) * 0.8 + palC(0.5) * 0.05, uHue.z * 0.75);
  o = vec4(bg + col, 1.0);
}`;
