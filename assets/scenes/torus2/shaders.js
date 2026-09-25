// TORUS2 — GLSL port of assets/math/hopf.js (fibre4 → rotSU2 → poleOffset → stereo), drawn as strokes through the core
// line renderer (CONTRACTS.md §1.12, path B): one instance per polyline segment, no vertex buffer. The point of a ring
// is computed analytically from gl_InstanceID by ringZ()/knotZ(); gl_VertexID belongs to lineCorner().
// Raw program (no HEAD), so palM() and TAU are local; uRes comes from the ctx.lines chunk.
// What TORUS2 adds to TORUS's port (docs/workers/brief-torus2.md spec 1): a brightness floor so no fibre sits in the
// fog, a fog floor that reads as a depth cue instead of a wall, a kick flash weighted toward the quiet inner families,
// and a hat shimmer running round the ring parameter.

// Tuning constants of the look — every one is a named manual setting, not a magic number in an expression.
const K = {
  SHIMK: 24.0,      // ripples of the hat shimmer around one ring
  FLASH: 0.95,      // brightness the kick flash adds to a silent pitch class
  FOGLO: 0.55,      // the far side of the nest never darker than this (TORUS: 0.32 — a wall)
  FOGHI: 1.25,
  FOGK: 0.55,       // how fast the fog falls with view depth
  FADE0: 1.15,      // the spray fade starts at FADE0 × the nest radius (TORUS: 0.98 — it clipped the body)
  FADE1: 1.75,
};

import { GLSL as ATTRACTORS } from './attractors.js';

const BODY = ATTRACTORS + `
#define TAU 6.2831853
#define NEAR 0.05
#define SHIMK ${K.SHIMK.toFixed(1)}
#define FLASH ${K.FLASH.toFixed(2)}
uniform vec4  uCam;      // yaw, pitch, distance, focal (1/tan(fov/2))
uniform vec4  uCen;      // centroid of the tumbled family in R3 (xyz) and its radius (w)
uniform float uPsi0;     // Hopf flow  2pi(beatCount+beatPhase)/8
uniform float uAlpha;    // SU(2) tumble
uniform float uDelta;    // pole offset  0.6*tension
uniform float uSubP;     // tube fatten  0.25*sub
uniform float uCollapse; // drop collapse toward the core circle, 0..1
uniform vec3  uMood;     // LOOK.mood hue, sat, bri
uniform float uSpread;   // LOOK.mood spread
uniform float uGain;     // overall opacity (presence, drop)
uniform float uSize;     // stroke width in px at unit view depth (CPU: px at the centroid x camera distance)
uniform int   uSeg;      // segments per ring (the whole tier budget lives here)
uniform int   uFib;      // fibre slots per pitch-class family — the longitude grid, never tier-dependent
uniform int   uDraw;     // how many of those slots are drawn right now (the build's growth)
uniform float uFibF;     // the same count, eased and fractional: the newest ring fades in instead of popping
uniform int   uKnotN;    // segments on the highlighted torus knot
uniform vec2  uKnotPQ;   // (p,q) from MS.interval
uniform float uKnotT;    // knot parameter offset (harmUnw)
uniform float uKnotTh;   // colatitude of the loudest family's torus
uniform vec2  uKnotBH;   // knot brightness, knot hue
uniform vec2  uGlowM;    // the brightness floor (0..0.5) and the loudest family's brightness
uniform float uFlashK;   // the kick follower that lights the core, 0..1
uniform float uShim;     // shimmer gain (hat x alive x novelty)
uniform float uWaveB[24];  // spec 2: age in beats of the last 8 launches per band (kick, snare, hat); < 0 = empty
uniform float uWaveA[24];  // the amplitude each was launched with
uniform vec3  uWaveW;    // bump width along the ring parameter per band
uniform vec3  uWaveD;    // how far each band's bump displaces the stroke (a fraction of the fibre's own radius)
uniform vec3  uWaveP;    // how much each band's bump brightens it
uniform float uLoud;     // the loudest family (the one the knot rides): the snare pulse is its own
uniform float uTheta[12];  // colatitude per pitch class
uniform float uChroma[12]; // chroma per pitch class
flat out vec3 vCol;
flat out float vA;

vec3 gEye, gRr, gUu, gFw;

// cosine palette rebuilt from LOOK.mood (HEAD's pal() is not available in a raw program)
vec3 palM(float t) {
  vec3 c = 0.5 + 0.5 * cos(TAU * (uMood.x + uSpread * t + vec3(0.0, 0.33, 0.67)));
  float l = dot(c, vec3(0.3, 0.59, 0.11));
  return mix(vec3(l), c, uMood.y) * uMood.z;
}
// rotSU2: mixes z1 and z2, maps fibres to fibres, tumbles the whole family rigidly on S3
vec4 su2(vec4 z, float a) {
  float c = cos(a), s = sin(a);
  return vec4(z.x * c - z.z * s, z.y * c - z.w * s, z.x * s + z.z * c, z.y * s + z.w * c);
}
// poleOffset: rotate the (Im z1, Im z2) plane, moving the projection pole toward the picture
vec4 poleOff(vec4 z, float d) {
  float c = cos(d), s = sin(d);
  return vec4(z.x, z.y * c - z.w * s, z.z, z.y * s + z.w * c);
}
// the Hopf flow e^{i psi} (z1, z2)
vec4 flow(vec4 z, float a) {
  float c = cos(a), s = sin(a);
  return vec4(z.x * c - z.y * s, z.x * s + z.y * c, z.z * c - z.w * s, z.z * s + z.w * c);
}

// point at ring parameter t (0..1) on one ring, on S3. Ring = family fam (pitch class) x slot sub: family k is the
// whole latitude circle theta_k, its fibres run right around phi so they cover one full torus, and the families are
// interleaved by a twelfth of the fibre spacing. The longitude grid is uFib slots wide however many are drawn.
vec4 ringZ(int fam, int sub, float t) {
  float phi = (float(sub) + float(fam) / 12.0) * TAU / float(uFib);
  float theta = min(mix(uTheta[fam], 0.05, uCollapse) * (1.0 + uSubP), 1.55);
  float psi = t * TAU + uPsi0 + float(sub) * 0.7;
  float c = cos(theta * 0.5), s = sin(theta * 0.5);
  float a1 = psi + phi * 0.5, a2 = psi - phi * 0.5;
  return vec4(c * cos(a1), c * sin(a1), s * cos(a2), s * sin(a2));
}
// point at t on the (p,q) torus knot of the loudest family's torus (knot4 + hopfFlow of hopf.js).
// p and q are integers, so t = 1 and t = 0 are the same point: the strand closes.
vec4 knotZ(float t) {
  float a = t * TAU + uKnotT;
  float c = cos(uKnotTh * 0.5), s = sin(uKnotTh * 0.5);
  vec4 z = vec4(c * cos(uKnotPQ.x * a), c * sin(uKnotPQ.x * a), s * cos(uKnotPQ.y * a), s * sin(uKnotPQ.y * a));
  return flow(z, uPsi0);
}

// spec 2: the waves of all three bands at ring parameter t of family fam. A wave launched age beats ago sits at
// t = (age / 4) mod 1 — one full ring per bar — with a gaussian bump of the band's width and a fade of exp(-age/2).
// The rhythm is therefore the spacing of the bumps: four-on-the-floor lands them at 0, 1/4, 1/2, 3/4.
void waves(float t, int fam, out float disp, out float pulse) {
  disp = 0.0;
  pulse = 0.0;
  for (int b = 0; b < 3; b++) {
    if (b == 1 && fam != int(uLoud)) continue;   // the snare's bright pulse rides the loudest family alone
    float wd = uWaveW[b];
    for (int s = 0; s < 8; s++) {
      float age = uWaveB[b * 8 + s];
      if (age < 0.0) continue;
      float d = t - fract(age * 0.25);
      d -= floor(d + 0.5);                        // the nearest image of the bump round the closed ring
      float g = exp(-(d * d) / (wd * wd)) * exp(-age * 0.5) * uWaveA[b * 8 + s];
      disp += g * uWaveD[b];                      // every wave is a displacement AND a brightness pulse; the bands
      pulse += g * uWaveP[b];                     // differ in which of the two dominates (spec 2)
    }
  }
}

void camBasis() {
  float cy = cos(uCam.x), sy = sin(uCam.x), cp = cos(uCam.y), sp = sin(uCam.y);
  gEye = uCen.xyz + uCam.z * vec3(cp * cy, cp * sy, sp);
  gFw = normalize(uCen.xyz - gEye);
  gRr = normalize(cross(gFw, vec3(0.0, 0.0, 1.0)));
  gUu = cross(gRr, gFw);
}
// S3 -> stereographic R3. The fade out at the projection pole and past the framed body of the nest comes back with it;
// the nest's own body is inside FADE0 x its radius, so the fog is a depth cue and not a wall (spec 1b).
vec3 world(vec4 z, out float fade) {
  z = su2(z, uAlpha);
  z = poleOff(z, uDelta);
  float d = 1.0 - z.w;                       // stereographic denominator
  vec3 p = z.xyz / max(d, 0.07);             // (x1, y1, x2) / (1 - y2)
  fade = smoothstep(0.045, 0.13, d) * (1.0 - smoothstep(uCen.w * ${K.FADE0.toFixed(2)}, uCen.w * ${K.FADE1.toFixed(2)}, distance(p, uCen.xyz)));
  return p;
}
// R3 -> clip. z = v.z - 2*near with w = v.z (§1.12), so depth grows with distance and the clip z stays inside (-w, w)
// for every point we keep. w <= 0 makes the line renderer drop the whole segment.
vec4 proj(vec3 p, out float vz) {
  vec3 q = p - gEye;
  vec3 v = vec3(dot(q, gRr), dot(q, gUu), dot(q, gFw));
  vz = max(v.z, NEAR);
  if (!(v.z > 2.0 * NEAR)) return vec4(0.0, 0.0, 0.0, -1.0);
  float asp = uRes.x / max(uRes.y, 1.0);
  return vec4(uCam.w * v.x / asp, uCam.w * v.y, v.z - 2.0 * NEAR, v.z);
}

// A fibre point in R3 with the travelling waves displacing it normal to the stroke. Every fibre projects to a ROUND
// circle (tools/test_hopf.js proves it to 1e-9), so the point at t + 1/2 is that circle's exact antipode and their
// midpoint is its centre: p − centre is the fibre's own radius vector, which exists whatever the tumble does — a
// "radial scale about a torus centre circle" does not, once the family is tumbled (DECISIONS §4: cyclides).
vec3 ringPt(int fam, int sub, float t, out float fade, out float pulse) {
  float f2, disp;
  vec3 p = world(ringZ(fam, sub, t), fade);
  vec3 pa = world(ringZ(fam, sub, t + 0.5), f2);
  waves(t, fam, disp, pulse);
  vec3 d = p - 0.5 * (p + pa);
  float L = length(d);
  if (L > 1e-5) p += d * (disp * min(L, uCen.w * 1.2) / L);
  return atMorph(p, uCen.xyz, uCen.w);       // spec 5: the whole bumped ring is advected along the attractor
}

void main() {
  camBasis();
  int s = gl_InstanceID;
  int base = 12 * uDraw * uSeg;
  vec3 p0, p1;
  float f0, f1, bri, hueT, wm;
  if (s >= base) {
    int i = s - base;
    float t0 = float(i) / float(uKnotN), t1 = float(i + 1) / float(uKnotN);
    p0 = atMorph(world(knotZ(t0), f0), uCen.xyz, uCen.w);
    p1 = atMorph(world(knotZ(t1), f1), uCen.xyz, uCen.w);
    float dk, qk;
    waves(t0, int(uLoud), dk, qk);            // the knot rides the loudest family, so it takes that family's pulse
    bri = uKnotBH.x * (1.0 + qk);
    hueT = uKnotBH.y;
    wm = 1.6;                                 // the melody strand reads as the thickest line in the picture
  } else {
    int ring = s / uSeg;
    int i = s - ring * uSeg;
    int fam = ring - (ring / 12) * 12, sub = ring / 12;
    float t0 = float(i) / float(uSeg), t1 = float(i + 1) / float(uSeg);
    float q0, q1;
    p0 = ringPt(fam, sub, t0, f0, q0);
    p1 = ringPt(fam, sub, t1, f1, q1);
    float cw = uChroma[fam];
    // spec 1a: the quiet pitch classes used to sit at 0.05 and vanish. They now never fall below uGlowM.x of the
    // loudest family, so the inside of the nest is lit; 1c: the kick flashes the quiet (inner) families hardest.
    bri = max(0.05 + 1.35 * cw * cw, uGlowM.x * uGlowM.y) + FLASH * uFlashK * (1.0 - cw);
    // spec 1d: a fine shimmer running round the ring parameter on the hats
    bri *= 1.0 + uShim * sin(SHIMK * t0 * TAU + float(ring) * 1.7);
    bri *= 1.0 + q0;                          // spec 2: the snare's bright pulse travelling round the ring
    bri *= clamp(uFibF - float(sub), 0.0, 1.0);   // spec 4c: the ring the build is adding fades in over ~0.75 s
    hueT = float(fam) / 12.0 - 0.5;   // the anchor is the MIDDLE of the twelve hues, not the first of them
    wm = 1.0;
  }
  float v0, v1;
  vec4 c0 = proj(p0, v0);
  vec4 c1 = proj(p1, v1);
  // depth cue: with 'over' the far strokes are already hidden where they are behind, and a fog on the colour keeps the
  // near shell reading as the near one. Its floor is high (spec 1b): a depth cue, never a wall.
  float fog = clamp(${K.FOGHI.toFixed(2)} - ${K.FOGK.toFixed(2)} * (0.5 * (v0 + v1) / max(uCam.z, 0.5)), ${K.FOGLO.toFixed(2)}, ${K.FOGHI.toFixed(2)});
  vA = min(f0, f1);                           // the dimmer end wins, so a segment that leaps to infinity stays dark
  vCol = palM(hueT) * bri * fog * uGain;
  gl_Position = lineCorner(c0, c1, clamp(uSize * wm / v0, 0.3, 9.0), clamp(uSize * wm / v1, 0.3, 9.0));
}
`;

const FRAG = `
flat in vec3 vCol;
flat in float vA;
out vec4 o;
void main() {
  // Alpha is coverage, not brightness (§1.12): consecutive capsules of a polyline overlap at every joint, and a
  // semi-transparent stroke would composite twice there. The stroke is opaque and the fade lives in the colour; only
  // its last approach to zero, out at the projection pole, is allowed into alpha.
  float a = lineMask() * smoothstep(0.0, 0.3, vA);
  if (a < 0.004) discard;                     // never write depth for a stroke nobody can see
  o = vec4(vCol * vA * a, a);
}
`;

// The ctx.lines GLSL chunks are only reachable through ctx, so the sources are built in init().
export const mkVS = (chunk) => '#version 300 es\nprecision highp float;\nprecision highp int;\n' + chunk + BODY;
export const mkFS = (chunk) => '#version 300 es\nprecision highp float;\n' + chunk + FRAG;
