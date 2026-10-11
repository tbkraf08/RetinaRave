// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// GIELIS — the GLSL. Every stroke point is built in the VERTEX shader from gl_InstanceID → (slot, ring, segment) and
// the generated twin of the superformula (assets/math/gielis.js GLSL: sfR / sfPoint, whose constants are written from
// the JS values so the port cannot drift — tools/test_gielis.js checks them to 0). Path B of the line renderer
// (CONTRACTS §1.12): no vertex buffer at all, ctx.lines owns the quad and its VAO; gl_VertexID belongs to lineCorner().
// A raw program, so there is no HEAD: palM() and TAU are local and uRes comes from the ctx.lines chunk.
//
// The index. Slots are the twelve families in LOUDNESS order (slot 0 is the loudest, and the snare's pulse is its own).
// Each slot's ring gets its own segment count — a five-turn family covers five times the θ — so the instance index is
// found through a cumulative table uOff[13] rather than by division: the one place a path-B scene pays for a per-family
// budget. Twelve iterations per vertex, no branches inside them.

import { GLSL as GIELIS } from '../../math/gielis.js';

// The look's manual settings — named constants, never magic numbers inside an expression.
const K = {
  SHIMK: 24.0,     // ripples of the hat shimmer around one ring
  FLASH: 0.95,     // brightness a kick adds to a family under the median
  FOGLO: 0.55,     // the far side of the nest is never darker than this (a depth cue, not a wall)
  FOGHI: 1.25,
  FOGK: 0.55,      // how fast the fog falls with view depth
  WHUE_K: 0.8,     // how hard a wave's own pulse pulls the stroke's hue toward the launching family's …
  WHUE_M: 0.7,     // …and how far it may ever carry it
  KNEE: 0.8,       // the luminance knee the user asked for on NAV2: the glow peaks stay, the core never washes the
  KNEE_S: 3.0,     // lobes out ("I like the bright / glowy look, but not so bright that I can't see the shapes")
  NEAR: 0.05,
};

const BODY = GIELIS + `
#define GPI 3.14159265
#define SHIMK ${K.SHIMK.toFixed(1)}
#define FLASH ${K.FLASH.toFixed(2)}
#define WHUE_M ${K.WHUE_M.toFixed(2)}
#define NEAR ${K.NEAR.toFixed(2)}
uniform vec4  uCam;        // yaw, elevation, distance, focal (1/tan(fov/2))
uniform int   uRings;      // latitude rings per family
uniform int   uDraw;       // how many families are drawn right now
uniform float uDrawF;      // the same count, fractional: the newest family fades in instead of popping
uniform int   uOff[13];    // cumulative segments per slot (uOff[0] = 0, uOff[12] = the total drawn)
uniform float uMA[12];     // the lobe count m per slot …
uniform float uMB[12];     // …and the one before the last key change
uniform float uMF;         // the cross-fade between them (a rational m does not interpolate: fade the RADII)
uniform float uQt[12];     // turns of theta the slot's ring needs to close
uniform float uPc[12];     // which pitch class the slot is (its hue, and which band drives its ring phase)
uniform float uSz[12];     // its radius
uniform float uBr[12];     // its brightness
uniform float uNorm[12];   // and 1/max(1, rMax) of its own profile: the deep pinch may not grow the family (nest.js normOf)
uniform vec4  uLean[12];   // (n2, n3, a, b) PER SLOT: n2 from the family's own chroma, n3 from the mood's valence,
                           // with the section template's offset added on top (nest.js LEAN_C / LEAN_V)
uniform float uN1;         // the pinch: the beat's breath, one value for the whole nest
uniform float uN1Phi;      // the LATITUDE curve's own, shallower pinch: the body is shaped, never spiky in latitude
uniform float uPhiMax;     // latitude spans +-uPhiMax * pi/2
uniform float uSegR[12];   // segments on one of this slot's rings …
uniform float uSegM;       // …and on one of its meridian strokes (shared: a meridian covers half a turn of phi)
uniform float uMerid;      // how many meridians each family gets
uniform float uThOff;      // a new section re-picks the rings' phase (turns)
uniform vec3  uPsi3;       // ring phase per band: low (pc 0-3), mid (4-7), high (8-11) — flowBass/Mid/High
uniform float uSlip;       // riser / roll drift the rings in latitude: a closed ring opens into a helix
uniform float uOpen[12];   // >0.5 when THIS slot's ring no longer closes, so its wrapping segment is skipped
uniform float uShim;       // shimmer gain (hat x alive x novelty)
uniform float uFlashK;     // the kick follower that lights the quiet inner families
uniform float uMed;        // the median family brightness — the flash goes to everything under it
uniform float uGain;       // overall opacity (presence, the drop's rebound)
uniform float uStroke;     // stroke width in px at unit view depth
uniform vec3  uMood;       // LOOK.mood hue, sat, bri (the key anchor is already inside uMood.x)
uniform float uSpread;     // how far the twelve hues spread around the anchor
uniform float uWaveB[24];  // age in beats of the last 8 launches per band (kick, snare, hat); < 0 = empty
uniform float uWaveA[24];  // the amplitude each was launched with …
uniform float uWaveH[24];  // …and the hue coordinate of the family that launched it (the note)
uniform vec3  uWaveW;      // the bump's gaussian sigma along the ring parameter, per band
uniform vec3  uWaveD;      // how far it displaces the stroke (a fraction of the family's own radius)
uniform vec3  uWaveP;      // and how much it brightens it
flat out vec3 vCol;

vec3 gEye, gRr, gUu, gFw;

// the cosine palette rebuilt from LOOK.mood (HEAD's pal() is not available in a raw program)
vec3 palM(float t) {
  vec3 c = 0.5 + 0.5 * cos(GTAU * (uMood.x + uSpread * t + vec3(0.0, 0.33, 0.67)));
  float l = dot(c, vec3(0.3, 0.59, 0.11));
  return mix(vec3(l), c, uMood.y) * uMood.z;
}

// Every sound a wave: a rising edge in kick / snare / hat launched a bump that runs round the ring parameter at one
// ring per bar and fades over two. Both a displacement AND a brightness pulse (torus2.md's trap: with only one of the
// two the SPACING of the bumps — which is the rhythm — cannot be read), and it carries the launching family's hue.
void waves(float t, int slot, out float disp, out float pulse, out float hue) {
  disp = 0.0;
  pulse = 0.0;
  float hs = 0.0, ws = 0.0;
  for (int b = 0; b < 3; b++) {
    if (b == 1 && slot != 0) continue;          // the snare's sharp pulse rides the loudest family alone
    float wd = uWaveW[b];
    for (int j = 0; j < 8; j++) {
      float age = uWaveB[b * 8 + j];
      if (age < 0.0) continue;
      float d = t - fract(age * 0.25);
      d -= floor(d + 0.5);                      // the nearest image of the bump round the closed ring
      float g = exp(-(d * d) / (wd * wd)) * exp(-age * 0.5) * uWaveA[b * 8 + j];
      disp += g * uWaveD[b];
      pulse += g * uWaveP[b];
      hs += g * uWaveH[b * 8 + j];
      ws += g;
    }
  }
  hue = ws > 1e-5 ? hs / ws : 0.0;
}

// One point of slot s at (theta, phi). BOTH curves carry the family's species now: the equator's lobe count is its m
// over q turns, and the latitude profile's is the same m at its own shallower pinch uN1Phi — so the body is a shaped
// solid rather than a ball of hoops. A rational m does not interpolate, so a key change cross-fades the RADII of both
// curves. wav is 0 on a meridian: the waves and the shimmer ride the rings, the meridians only carry the flash and
// the family's hue. The wave displaces the point radially by a fraction of the family's own (normalised) radius.
vec3 ptAt(int slot, float th, float phi, float t, float wav, out float pulse, out float hue) {
  vec4 Ln = uLean[slot];
  vec2 Qb = Ln.zw;
  float r1 = mix(sfR(th, vec4(uMA[slot], uN1, Ln.x, Ln.y), Qb), sfR(th, vec4(uMB[slot], uN1, Ln.x, Ln.y), Qb), uMF);
  float r2 = mix(sfR(phi, vec4(uMA[slot], uN1Phi, Ln.x, Ln.y), Qb), sfR(phi, vec4(uMB[slot], uN1Phi, Ln.x, Ln.y), Qb), uMF);
  float sc = uSz[slot] * uNorm[slot];
  vec3 p = vec3(r1 * cos(th) * r2 * cos(phi), r1 * sin(th) * r2 * cos(phi), r2 * sin(phi)) * sc;
  float disp = 0.0;
  pulse = 0.0;
  hue = 0.0;
  if (wav > 0.5) {
    waves(t, slot, disp, pulse, hue);
    float L = length(p);
    if (L > 1e-5) p += p * (disp * sc / L);
  }
  return p;
}
// A latitude ring: fixed phi, theta round q turns of the ring parameter t, so one wave runs the whole closed curve in
// one bar however many turns that curve takes.
vec3 ptRing(int slot, int ring, float t, out float pulse, out float hue) {
  int band = int(uPc[slot]) / 4;
  float th = t * GTAU * uQt[slot] + uPsi3[band] + uThOff * GTAU;
  float phi = (float(ring) / float(uRings - 1) - 0.5) * GPI * uPhiMax + uSlip * t;
  return ptAt(slot, th, phi, t, 1.0, pulse, hue);
}
// A meridian: fixed theta (one of uMerid spread round one turn, carried by the same phase the rings turn on), phi
// sweeping the whole drawn latitude range.
vec3 ptMerid(int slot, int mer, float t, out float pulse, out float hue) {
  int band = int(uPc[slot]) / 4;
  float th = (float(mer) / uMerid) * GTAU + uPsi3[band] + uThOff * GTAU;
  float phi = (t - 0.5) * GPI * uPhiMax;
  return ptAt(slot, th, phi, t, 0.0, pulse, hue);
}

void camBasis() {
  float cy = cos(uCam.x), sy = sin(uCam.x), cp = cos(uCam.y), sp = sin(uCam.y);
  gEye = uCam.z * vec3(cp * cy, cp * sy, sp);
  gFw = normalize(-gEye);
  gRr = normalize(cross(gFw, vec3(0.0, 0.0, 1.0)));
  gUu = cross(gRr, gFw);
}
// R3 -> clip. z = v.z - 2*near with w = v.z (§1.12), so depth grows with distance and clip z stays inside (-w, w);
// w <= 0 makes the line renderer drop the whole segment.
vec4 proj(vec3 p, out float vz) {
  vec3 q = p - gEye;
  vec3 v = vec3(dot(q, gRr), dot(q, gUu), dot(q, gFw));
  vz = max(v.z, NEAR);
  if (!(v.z > 2.0 * NEAR)) return vec4(0.0, 0.0, 0.0, -1.0);
  float asp = uRes.x / max(uRes.y, 1.0);
  return vec4(uCam.w * v.x / asp, uCam.w * v.y, v.z - 2.0 * NEAR, v.z);
}

void main() {
  camBasis();
  int s = gl_InstanceID;
  int slot = 0;
  for (int k = 1; k < 12; k++) { if (s >= uOff[k]) slot = k; }
  int local = s - uOff[slot];
  int segs = max(1, int(uSegR[slot]));
  int segM = max(1, int(uSegM));
  int rings = uRings * segs;                        // this slot's rings first, then its meridians
  bool mer = local >= rings;
  int idx = mer ? (local - rings) / segM : local / segs;    // which ring, or which meridian
  int i = mer ? local - rings - idx * segM : local - idx * segs;
  int n = mer ? segM : segs;
  float t0 = float(i) / float(n), t1 = float(i + 1) / float(n);
  // a ring the lean or the unwind has opened: skip the wrapping segment (a meridian is open by construction)
  bool open = !mer && uOpen[slot] > 0.5 && i == n - 1;
  float q0, q1, h0, h1;
  vec3 p0 = mer ? ptMerid(slot, idx, t0, q0, h0) : ptRing(slot, idx, t0, q0, h0);
  vec3 p1 = mer ? ptMerid(slot, idx, t1, q1, h1) : ptRing(slot, idx, t1, q1, h1);
  float hueT = uPc[slot] / 12.0 - 0.5;          // the anchor is the MIDDLE of the twelve hues, not the first of them
  hueT = mix(hueT, h0, clamp(q0 * ${K.WHUE_K.toFixed(2)}, 0.0, WHUE_M));
  // the quiet families never fall below the floor (nest.js FLOOR), and a kick flashes everything under the median
  float bri = uBr[slot] + FLASH * uFlashK * clamp((uMed - uBr[slot]) / max(uMed, 0.05), 0.0, 1.0);
  if (!mer) bri *= 1.0 + uShim * sin(SHIMK * t0 * GTAU + float(slot) * 1.7);   // the shimmer rides the rings
  bri *= 1.0 + q0;                              // the travelling bump's own brightness pulse
  bri *= clamp(uDrawF - float(slot), 0.0, 1.0); // the family the build is adding fades in over ~0.75 s
  float v0, v1;
  vec4 c0 = proj(p0, v0);
  vec4 c1 = open ? vec4(0.0, 0.0, 0.0, -1.0) : proj(p1, v1);
  float fog = clamp(${K.FOGHI.toFixed(2)} - ${K.FOGK.toFixed(2)} * (0.5 * (v0 + v1) / max(uCam.z, 0.5)), ${K.FOGLO.toFixed(2)}, ${K.FOGHI.toFixed(2)});
  vCol = palM(hueT) * bri * fog * uGain;
  gl_Position = lineCorner(c0, c1, clamp(uStroke / v0, 0.3, 9.0), clamp(uStroke / v1, 0.3, 9.0));
}
`;

const FRAG = `
#define KNEE ${K.KNEE.toFixed(2)}
#define KNEE_S ${K.KNEE_S.toFixed(1)}
flat in vec3 vCol;
out vec4 o;
void main() {
  // Alpha is coverage, not brightness (§1.12): consecutive capsules overlap inside every joint, so the stroke stays
  // opaque and every fade lives in the colour.
  float a = lineMask();
  if (a < 0.004) discard;
  // The knee: above KNEE the stroke's luminance is compressed toward KNEE + 1/KNEE_S instead of climbing, so the glow
  // peaks survive the bloom but the lobes never wash out into one white core.
  float L = dot(vCol, vec3(0.3, 0.59, 0.11));
  vec3 c = L > KNEE ? vCol * ((KNEE + (L - KNEE) / (1.0 + KNEE_S * (L - KNEE))) / L) : vCol;
  o = vec4(c * a, a);
}
`;

// The ctx.lines GLSL chunks are only reachable through ctx, so the sources are built in init().
export const mkVS = (chunk) => '#version 300 es\nprecision highp float;\nprecision highp int;\n' + chunk + BODY;
export const mkFS = (chunk) => '#version 300 es\nprecision highp float;\n' + chunk + FRAG;
