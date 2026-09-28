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

// The sand's state pass: one texel per grain, RGBA16F = (x, y, z, seed). A fullscreen program into the other target.
// The walk step is |u|-proportional (the plate throws sand off where it moves) plus a descent on u^2 (the sand that
// lands on a line stays there) — the real mechanism, so the figure emerges instead of being drawn.
export const SAND_FS = CH + `
uniform sampler2D uPos;    // the other ping-pong target: the grains as they were last frame
uniform vec4 uFig;         // s, h, bnd, unused
uniform vec4 uStep;        // walk step, descent gain, frame counter, dt
uniform vec4 uAir;         // gate (1 = the plate is driven), amplitude, the void's lift, the drop's spiral
uniform vec2 uKick;        // the kick: its age in seconds, and how hard it hit
uniform vec2 uGrid;        // the state texture's size
#define CH_KICKJ 4.5       // how far a kick of velocity 1 scatters a grain, plate units per second. The user:
                           // "I don't want it to be so bright that can't see the shapes" — 9.0 buried the figure
#define CH_KICKTC 0.05     // and how fast that shake dies

float h11(float p) { p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }

void main() {
  // gl_FragCoord IS the texel being written, so the grain a pass touches never depends on the viewport's height —
  // a tier flip may draw fewer grains, it can never shuffle which texel holds which grain
  vec2 tc = floor(gl_FragCoord.xy);
  vec4 s = texture(uPos, (tc + 0.5) / uGrid);
  float id = tc.y * uGrid.x + tc.x;
  // a fresh grain: scattered over the plate by its own hash, so the first frame is already sand and not a point
  if (s.w < 0.5) {
    float a = h11(id * 1.31 + 2.7) * ${(Math.PI * 2).toFixed(7)}, rr = sqrt(h11(id * 2.17 + 9.1));
    o = vec4(cos(a) * rr * 0.97, sin(a) * rr * 0.97, 0.0, 1.0);
    return;
  }
  vec2 p = s.xy;
  float u = chField(p, uFig.x, uFig.y, uFig.z);
  // the random walk: hash noise on the grain id and the frame counter — never Math.random, never a wall clock
  float n1 = h11(id * 0.717 + uStep.z * 1.913) - 0.5;
  float n2 = h11(id * 1.331 + uStep.z * 2.719 + 7.3) - 0.5;
  vec2 jit = vec2(n1, n2) * uStep.x * abs(u) * uAir.y * uAir.x;
  // the kick SHAKES the plate: the sand is scattered off its lines and has to find them again, which is what makes
  // the settle instrument bite and what the eye reads as a throw. Placed by kickAge, so it is exact to the sub-frame.
  jit += vec2(n2, n1) * (CH_KICKJ * uKick.y * exp(-max(0.0, uKick.x) / CH_KICKTC));
  // the descent on u^2: grad(u^2) = 2u grad(u), by a central difference of the same field the plate pass draws
  float e = 0.004;
  vec2 gr = vec2(chField(p + vec2(e, 0.0), uFig.x, uFig.y, uFig.z) - chField(p - vec2(e, 0.0), uFig.x, uFig.y, uFig.z),
                 chField(p + vec2(0.0, e), uFig.x, uFig.y, uFig.z) - chField(p - vec2(0.0, e), uFig.x, uFig.y, uFig.z)) / (2.0 * e);
  vec2 desc = -uStep.y * u * gr * uAir.x;
  // the void: no drive, so the sand lifts and drifts instead of settling, and the build spirals it inward
  vec2 tang = vec2(-p.y, p.x);
  vec2 drift = uAir.z * vec2(n2, -n1) * 0.7 + uAir.w * (tang * 0.55 - p * 0.22);   // wind in, do not collapse
  p += (jit + desc + drift) * uStep.w;      // every term is per SECOND, so the walk is the same at any frame rate
  // the plate keeps its sand: reflect at the boundary rather than clamp, so no grain piles up on the rim
  float din = chIn(p, uFig.z);
  if (din < 0.0) p += 2.2 * din * normalize(p + 1e-5);
  float z = uAir.z * (0.10 + 0.25 * h11(id * 3.71 + 1.1));        // how high this grain floats in the void
  o = vec4(clamp(p, vec2(-1.0), vec2(1.0)), z, 1.0);
}`;

// The sand's draw pass: one gl.POINTS per grain, positions from the state texture by gl_VertexID (DUST's model).
// The kick's leap is ANALYTIC in kickAge — z = v a - g a^2 / 2 — so the throw is placed to the sub-frame and no
// state is integrated: at the same kickAge the grain is at the same height in every run.
// (a raw two-source program: no HEAD, so it declares its own version, precision and TAU)
const RAW = `#version 300 es
precision highp float;
precision highp int;
#define TAU 6.2831853
`;

export const SAND_VS = RAW + CH + `
uniform sampler2D uPos;
uniform mat4 uVP;
uniform vec2 uGrid;
uniform vec2 uRes;
uniform vec4 uFig;         // s, h, bnd, unused
uniform vec4 uLeap;        // kickAge (s), kickVel, gravity, the leap's height gain
uniform vec4 uSand;        // point size in px, brightness, the gate's freeze, the void's lift
out float vU;
out float vZ;
float h11(float p) { p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
void main() {
  float id = float(gl_VertexID);
  vec2 uv = (vec2(mod(id, uGrid.x), floor(id / uGrid.x)) + 0.5) / uGrid;
  vec4 s = texture(uPos, uv);
  vec2 p = s.xy;
  float u = chField(p, uFig.x, uFig.y, uFig.z);
  // higher on the antinodes: a grain sitting on a nodal line is barely thrown, one on an antinode is thrown hard
  // higher on the antinodes, but never zero on a nodal line — that is where nearly all the sand IS, and a leap only
  // the antinodes could take would be a leap nobody sees
  float w = uLeap.w * (0.55 + 0.45 * abs(u)) * (0.6 + 0.8 * h11(id * 5.19 + 3.3));
  float a = max(0.0, uLeap.x);
  float leap = max(0.0, uLeap.y * w * a - 0.5 * uLeap.z * a * a);
  float z = s.z * uSand.w + leap;
  gl_Position = uVP * vec4(p, z, 1.0);
  float zc = max(gl_Position.w, 0.05);
  gl_PointSize = clamp(uSand.x * uRes.y / 720.0 / zc, 1.0, 12.0);
  vU = u;
  vZ = z;
}`;

export const SAND_FS_DRAW = RAW + LEANS + COMMON + `
uniform vec4 uHue;         // the sub note's hue offset, the antinode hue offset, fog, the void's lift
uniform vec4 uSand;        // point size, brightness, the gate's freeze, the void's lift
in float vU;
in float vZ;
out vec4 o;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = dot(c, c) * 4.0;
  float al = exp(-d * 3.2) - 0.03;
  if (al <= 0.0) discard;
  // sand on a nodal line is bright and takes the note's hue; sand in the air is dimmer and cooler
  float onLine = exp(-vU * vU * CH_SANDL);
  vec3 col = palC(uHue.x + 0.06 * vU) * (0.35 + 1.15 * onLine) + palC(uHue.x + 0.35) * min(1.0, vZ * 2.2) * 0.8;
  col *= uSand.y * (1.0 - 0.55 * uHue.z);
  o = vec4(col * al, 1.0);
}`;

// The settle instrument (hooks.settle): 1 where a grain is within DELTA of a nodal line, 0 elsewhere, written into an
// RGBA8 target so the readback is a byte read (CONTRACTS §1.1: readPixels(UNSIGNED_BYTE) from a float target is black).
// It only ever runs from a harness eval — a readback is a pipeline stall.
export const SETTLE_FS = CH + `
uniform sampler2D uPos;
uniform vec4 uFig;         // s, h, bnd, the delta a grain counts as settled within
uniform vec2 uGrid;
void main() {
  vec2 tc = floor(gl_FragCoord.xy);
  vec4 s = texture(uPos, (tc + 0.5) / uGrid);
  float u = chField(s.xy, uFig.x, uFig.y, uFig.z);
  o = vec4(abs(u) < uFig.w ? 1.0 : 0.0, s.z, 0.0, 1.0);
}`;
