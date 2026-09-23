// TORUS — GLSL port of assets/math/hopf.js (fibre4 → rotSU2 → poleOffset → stereo), drawn as strokes through the core
// line renderer (CONTRACTS.md §1.12, path B): one instance per polyline segment, no vertex buffer. The point of a ring
// is computed analytically from gl_InstanceID by ringZ()/knotZ(); gl_VertexID belongs to lineCorner().
// Raw program (no HEAD), so palM() is local; uRes comes from the ctx.lines chunk.

const BODY = `
#define TAU 6.2831853
#define NEAR 0.05
uniform vec4  uCam;      // yaw, pitch, distance, focal (1/tan(fov/2))
uniform vec4  uCen;      // centroid of the tumbled family in R3 (xyz) and its radius (w)
uniform float uPsi0;     // Hopf flow  2pi(beatCount+beatPhase)/8
uniform float uAlpha;    // SU(2) tumble  0.18*sin(GROOVE.rot)
uniform float uDelta;    // pole offset  0.6*tension
uniform float uBassP;    // tube fatten  0.25*bass
uniform float uCollapse; // drop collapse toward the core circle, 0..1
uniform vec3  uMood;     // LOOK.mood hue, sat, bri
uniform float uSpread;   // LOOK.mood spread
uniform float uGain;     // overall opacity (presence, drop)
uniform float uSize;     // stroke width in px at unit view depth (CPU: px at the centroid x camera distance)
uniform int   uSeg;      // segments per ring (the whole tier budget lives here)
uniform int   uFib;      // fibres (rings) per pitch-class family — never tier-dependent
uniform int   uKnotN;    // segments on the highlighted torus knot
uniform vec2  uKnotPQ;   // (p,q) from MS.interval
uniform float uKnotT;    // knot parameter offset (harmUnw)
uniform float uKnotTh;   // colatitude of the loudest family's torus
uniform vec2  uKnotBH;   // knot brightness, knot hue
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

// point i of n on one ring, on S3. Ring = family fam (pitch class) x sub-fibre sub, exactly as v0.1 indexed it:
// family k is the whole latitude circle theta_k, its fibres run right around phi so they cover one full torus, and the
// families are interleaved by a twelfth of the fibre spacing.
vec4 ringZ(int ring, int i, int n) {
  int fam = ring - (ring / 12) * 12;
  int sub = ring / 12;
  float phi = (float(sub) + float(fam) / 12.0) * TAU / float(uFib);
  float theta = min(mix(uTheta[fam], 0.05, uCollapse) * (1.0 + uBassP), 1.55);
  float psi = float(i) / float(n) * TAU + uPsi0 + float(sub) * 0.7;
  float c = cos(theta * 0.5), s = sin(theta * 0.5);
  float a1 = psi + phi * 0.5, a2 = psi - phi * 0.5;
  return vec4(c * cos(a1), c * sin(a1), s * cos(a2), s * sin(a2));
}
// point i of n on the (p,q) torus knot of the loudest family's torus (knot4 + hopfFlow of hopf.js).
// p and q are integers, so i = n and i = 0 are the same point: the strand closes.
vec4 knotZ(int i, int n) {
  float t = float(i) / float(n) * TAU + uKnotT;
  float c = cos(uKnotTh * 0.5), s = sin(uKnotTh * 0.5);
  vec4 z = vec4(c * cos(uKnotPQ.x * t), c * sin(uKnotPQ.x * t), s * cos(uKnotPQ.y * t), s * sin(uKnotPQ.y * t));
  return flow(z, uPsi0);
}

void camBasis() {
  float cy = cos(uCam.x), sy = sin(uCam.x), cp = cos(uCam.y), sp = sin(uCam.y);
  gEye = uCen.xyz + uCam.z * vec3(cp * cy, cp * sy, sp);
  gFw = normalize(uCen.xyz - gEye);
  gRr = normalize(cross(gFw, vec3(0.0, 0.0, 1.0)));
  gUu = cross(gRr, gFw);
}
// S3 -> stereographic R3 -> clip. z = v.z - 2*near with w = v.z (§1.12), so depth grows with distance and the
// clip z stays inside (-w, w) for every point we keep. w <= 0 makes the line renderer drop the whole segment.
vec4 proj(vec4 z, out float fade, out float vz) {
  z = su2(z, uAlpha);
  z = poleOff(z, uDelta);
  float d = 1.0 - z.w;                       // stereographic denominator
  vec3 p = z.xyz / max(d, 0.07);             // (x1, y1, x2) / (1 - y2)
  // tails to infinity, and the spray outside the framed body of the nest, fade out
  fade = smoothstep(0.045, 0.13, d) * (1.0 - smoothstep(uCen.w * 0.98, uCen.w * 1.45, distance(p, uCen.xyz)));
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
  int base = 12 * uFib * uSeg;
  vec4 z0, z1;
  float bri, hueT, wm;
  if (s >= base) {
    int i = s - base;
    int j = i + 1;
    if (j >= uKnotN) j = 0;
    z0 = knotZ(i, uKnotN);
    z1 = knotZ(j, uKnotN);
    bri = uKnotBH.x;
    hueT = uKnotBH.y;
    wm = 1.6;                                 // the melody strand reads as the thickest line in the picture
  } else {
    int ring = s / uSeg;
    int i = s - ring * uSeg;
    int j = i + 1;
    if (j >= uSeg) j = 0;                     // closed ring: the last segment wraps to point 0
    z0 = ringZ(ring, i, uSeg);
    z1 = ringZ(ring, j, uSeg);
    float cw = uChroma[ring - (ring / 12) * 12];
    bri = 0.05 + 1.35 * cw * cw;              // quiet pitch classes nearly vanish, so the chord's own tori read
    hueT = float(ring - (ring / 12) * 12) / 12.0;
    wm = 1.0;
  }
  float f0, f1, v0, v1;
  vec4 c0 = proj(z0, f0, v0);
  vec4 c1 = proj(z1, f1, v1);
  // depth cue: with 'over' the far strokes are already hidden where they are behind, and a linear fog on the colour
  // keeps the near shell of the nest reading as the near one instead of a flat tangle.
  float fog = clamp(1.25 - 0.55 * (0.5 * (v0 + v1) / max(uCam.z, 0.5)), 0.32, 1.25);
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
  // Alpha is coverage, not brightness: consecutive capsules of a polyline overlap at every joint, and a
  // semi-transparent stroke would composite twice there — a bead on every join. The stroke is opaque (it occludes,
  // which is the point of the depth test) and the fade lives in the colour; only its last approach to zero, out at
  // the projection pole, is allowed into alpha so a vanishing fibre dissolves instead of punching a black hole.
  float a = lineMask() * smoothstep(0.0, 0.3, vA);
  if (a < 0.004) discard;                     // never write depth for a stroke nobody can see
  o = vec4(vCol * vA * a, a);
}
`;

// The ctx.lines GLSL chunks are only reachable through ctx, so the sources are built in init().
export const mkVS = (chunk) => '#version 300 es\nprecision highp float;\nprecision highp int;\n' + chunk + BODY;
export const mkFS = (chunk) => '#version 300 es\nprecision highp float;\n' + chunk + FRAG;
