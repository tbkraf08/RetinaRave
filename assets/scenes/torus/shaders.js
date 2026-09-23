// TORUS — GLSL port of assets/math/hopf.js (fibre4 → rotSU2 → poleOffset → stereo), one gl.POINTS draw,
// no vertex buffer: the fibre/point indices come out of gl_VertexID. Raw program (no HEAD), so palM() is local.

export const VS = `#version 300 es
precision highp float;
precision highp int;
#define TAU 6.2831853
uniform vec2  uRes2;     // target size (px)
uniform vec4  uCam;      // yaw, pitch, distance, focal (1/tan(fov/2))
uniform vec4  uCen;      // centroid of the tumbled family in R3 (xyz) and its radius (w)
uniform float uPsi0;     // Hopf flow  2pi(beatCount+beatPhase)/8
uniform float uAlpha;    // SU(2) tumble  0.6*GROOVE.rot
uniform float uDelta;    // pole offset  0.9*tension
uniform float uBassP;    // tube fatten  0.25*bass
uniform float uCollapse; // drop collapse toward the core circle, 0..1
uniform vec3  uMood;     // LOOK.mood hue, sat, bri
uniform float uSpread;   // LOOK.mood spread
uniform float uGain;     // overall alpha (presence, density compensation)
uniform float uSize;     // point size at unit depth
uniform int   uPts;      // points per fibre
uniform int   uFib;      // fibres per family
uniform int   uKnotN;    // points on the highlighted torus knot
uniform vec2  uKnotPQ;   // (p,q) from MS.interval
uniform float uKnotT;    // knot parameter offset (harmUnw)
uniform float uKnotTh;   // colatitude of the loudest family's torus
uniform vec2  uKnotBH;   // knot brightness, knot hue
uniform float uTheta[12];  // colatitude per pitch class
uniform float uChroma[12]; // chroma per pitch class
out vec3 vCol;
out float vA;

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

void main() {
  int id = gl_VertexID;
  int base = 12 * uFib * uPts;
  vec4 z;
  float bright, hueT;
  if (id >= base) {
    float t = float(id - base) / float(uKnotN) * TAU + uKnotT;
    float c = cos(uKnotTh * 0.5), s = sin(uKnotTh * 0.5);
    z = vec4(c * cos(uKnotPQ.x * t), c * sin(uKnotPQ.x * t), s * cos(uKnotPQ.y * t), s * sin(uKnotPQ.y * t));
    z = flow(z, uPsi0);
    bright = uKnotBH.x;
    hueT = uKnotBH.y;
  } else {
    int fid = id / uPts;
    int pid = id - fid * uPts;
    int fam = fid - (fid / 12) * 12;
    int sub = fid / 12;
    // family k is the whole latitude circle theta_k: its fibres run right around phi, so they cover one full torus.
    // Families are interleaved by a twelfth of the fibre spacing, anchored at the pitch class's longitude 2 pi k / 12.
    float phi = (float(sub) + float(fam) / 12.0) * TAU / float(uFib);
    float theta = min(mix(uTheta[fam], 0.05, uCollapse) * (1.0 + uBassP), 1.55);
    float psi = float(pid) / float(uPts) * TAU + uPsi0 + float(sub) * 0.7;
    float c = cos(theta * 0.5), s = sin(theta * 0.5);
    float a1 = psi + phi * 0.5, a2 = psi - phi * 0.5;
    z = vec4(c * cos(a1), c * sin(a1), s * cos(a2), s * sin(a2));
    float cw = uChroma[fam];
    bright = 0.05 + 1.35 * cw * cw;   // quiet pitch classes nearly vanish, so the chord's own tori read
    hueT = float(fam) / 12.0;
  }
  z = su2(z, uAlpha);
  z = poleOff(z, uDelta);
  float d = 1.0 - z.w;                       // stereographic denominator
  vec3 p = z.xyz / max(d, 0.07);             // (x1, y1, x2) / (1 - y2)
  float fade = smoothstep(0.045, 0.13, d) * smoothstep(uCen.w * 1.45, uCen.w * 0.98, distance(p, uCen.xyz)); // tails to infinity fade out
  float cy = cos(uCam.x), sy = sin(uCam.x), cp = cos(uCam.y), sp = sin(uCam.y);
  vec3 eye = uCen.xyz + uCam.z * vec3(cp * cy, cp * sy, sp);
  vec3 fw = normalize(uCen.xyz - eye);
  vec3 rr = normalize(cross(fw, vec3(0.0, 0.0, 1.0)));
  vec3 uu = cross(rr, fw);
  vec3 qp = p - eye;
  vec3 v = vec3(dot(qp, rr), dot(qp, uu), dot(qp, fw));
  if (!(v.z > 0.05)) {
    gl_Position = vec4(4.0, 4.0, 0.0, 1.0);
    gl_PointSize = 0.0;
    vCol = vec3(0.0);
    vA = 0.0;
    return;
  }
  float asp = uRes2.x / max(uRes2.y, 1.0);
  gl_Position = vec4(uCam.w * v.x / asp, uCam.w * v.y, 0.0, v.z);
  gl_PointSize = clamp(uSize / v.z, 1.0, 4.0);
  vCol = palM(hueT);
  vA = uGain * bright * fade * (3.0 / (1.5 + v.z));
}
`;

export const FS = `#version 300 es
precision highp float;
in vec3 vCol;
in float vA;
out vec4 o;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float a = exp(-dot(d, d) * 9.0) * vA;
  o = vec4(vCol * a, a);
}
`;
