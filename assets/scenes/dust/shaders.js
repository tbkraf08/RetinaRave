// DUST — GPU particle swarm lifted from synapse scene 4 ("swarm").
// No vertex buffer: every particle is derived from gl_VertexID, so the whole cloud is one drawArrays(POINTS).
// The helpers below (hash11, rot, spec, wave, palM) are the GLSL_COMMON functions this scene actually uses,
// copied in rather than shared — HEAD is not prepended to a raw two-source program.
//
// §57 step 1: the cloud's spin, the torus's main turn and the galaxy's winding arrive as ONE angle computed on the
// beat grid (uSpin / uSpinG, grid.js) instead of three rates read off the flow clocks. uFlow is left with the one
// job it can keep: the phase of the roughness jitter, where a musical-time scramble is exactly what is wanted.

export const VS_DUST = `#version 300 es
precision highp float;
precision highp int;
#define TAU 6.2831853

uniform mat4 uVP;          // view-projection built on the CPU in update()
uniform vec2 uRes;         // target size in pixels
uniform float uCount;      // particles this frame (Q tier) — brightness is normalised by it
uniform vec3 uForm;        // formation from, formation to, cross-fade 0..1
uniform float uSpin;       // the beat grid: the eased nudge-per-beat angle in radians (grid.js, CPU side)
uniform float uSpinG;      // the same angle at the galaxy's winding rate
uniform float uFlow;       // MS.flow — musical time. The jitter's phase and the slow drift, never the beat.
uniform float uFlowMid;    // MS.flowMid — the per-grain wobble and the ribbon's twist (slow drift)
uniform float uBassS;      // MS.bassS
uniform float uMidS;       // MS.midS
uniform float uLevel;      // MS.lvl
uniform float uKick;       // MS.kick
uniform float uDrop;       // MS.dropEnv
uniform float uTension;    // MS.tension
uniform float uHat;        // MS.hat
uniform float uAlive;      // MS.alive
uniform float uHue;        // LOOK.mood.hue
uniform float uSat;        // LOOK.mood.sat
uniform float uBri;        // LOOK.mood.bri
uniform float uSpread;     // LOOK.mood.spread
uniform float uInvert;     // LOOK.mood.invert
uniform float uAngular;    // LOOK.mood.angular
uniform sampler2D uSpec;   // 256x1 log spectrum: each particle owns one bin
uniform sampler2D uWave;   // 512x1 waveform: the ribbon formation is literally the waveform

out vec3 vCol;

float hash11(float p){ p = fract(p * .1031); p *= p + 33.33; p *= p + p; return fract(p); }
mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float spec(float x){ return texture(uSpec, vec2(clamp(x, 0.002, 0.998), .5)).r; }
float wave(float x){ return texture(uWave, vec2(clamp(x, 0.002, 0.998), .5)).r * 2. - 1.; }

// The mood palette: hue centre, spread, saturation and brightness all steered by the music on the CPU side.
vec3 palM(float t){
  vec3 c = .5 + .5 * cos(TAU * (uHue + (t - .5) * uSpread + vec3(0., .33, .67)));
  c = pow(c, vec3(1.7));
  c = mix(c, vec3(1.) - c, uInvert * .85);                   // a drop inverts the palette
  float l = dot(c, vec3(.299, .587, .114));
  return mix(vec3(l), c, uSat) * uBri;
}

// Four formations. n = particle's normalised index, h = three fixed hashes, id = gl_VertexID.
vec3 form(int k, float n, vec3 h, float id){
  // 0: Fibonacci sphere — y sweeps the poles linearly (equal-area bands) and the azimuth advances by the
  //    golden angle 2pi/phi^2 = 2.39996 rad per particle, which is the most irrational turn there is,
  //    so no two particles ever line up into a seam.
  if (k == 0){ float y = 1. - 2. * n, rr = sqrt(max(0., 1. - y * y)), ph = id * 2.39996; return vec3(cos(ph) * rr, y, sin(ph) * rr) * 1.05; }
  // 1: torus — (R + r cos v) around the main circle u, r sin v up the tube; r breathes with the slow bass.
  //    u turns with the beat, a little faster than the cloud around it, so the ring reads as the thing being nudged.
  if (k == 1){ float u = TAU * h.x + uSpin * .7, v = TAU * h.y + uFlowMid * .3; float R = 1.1, rr = .38 + .2 * uBassS;
               return vec3((R + rr * cos(v)) * cos(u), rr * sin(v), (R + rr * cos(v)) * sin(u)); }
  // 2: three-arm galaxy — radius is sqrt-distributed (uniform area), the arm is a log-ish spiral whose
  //    winding rate falls off as 1/(r + .35) so the core turns faster than the rim. It winds per beat, so every
  //    beat shears the arms a little — most in the core, least at the rim, which is what a spiral arm is.
  if (k == 2){ float rr = sqrt(h.x) * 1.7 + .05; float arm = floor(h.y * 3.) / 3. * TAU; float an = rr * 2.6 + arm + uSpinG / (rr + .35) + (h.z - .5) * .5;
               return vec3(cos(an) * rr, (h.z - .5) * .22 / (rr + .4), sin(an) * rr); }
  // 3: the waveform itself as a twisting ribbon.
  float x = n * 2. - 1.; float w = wave(n);
  vec3 pz = vec3(x * 1.9, w * .75 * (.4 + uLevel), (h.y - .5) * .12 + (h.z - .5) * .5 * uMidS);
  pz.yz *= rot(x * 2.5 + uFlowMid * .4);
  return pz;
}

void main(){
  float id = float(gl_VertexID), n = id / uCount;
  vec3 h = vec3(hash11(id * 1.31 + 1.), hash11(id * 2.17 + 7.), hash11(id * 3.73 + 13.));
  float fx = pow(h.x, 1.4) * .95;                             // more particles own the low bins
  float amp = spec(fx);                                       // this particle's band, right now
  // formation cross-fade, staggered per particle so the cloud pours from one shape into the next
  vec3 pos = mix(form(int(uForm.x), n, h, id), form(int(uForm.y), n, h, id), smoothstep(0., 1., clamp(uForm.z * 1.4 - h.z * .4, 0., 1.)));
  pos += .16 * (uMidS + .1) * sin(pos.yzx * 3.1 + uFlowMid * .9 + h.y * TAU);
  vec3 dir = normalize(pos + 1e-4);
  pos += dir * amp * .55 * (.3 + uLevel);                     // each particle pushed out by its own band
  pos *= 1. + uKick * .22 * h.z + uDrop * 1.6 * h.y * h.y - .2 * uTension + .1 * uBassS;
  pos += (h - .5) * .5 * uTension * sin(uFlow * 40. + id) * .12;   // jitter as tension rises
  pos = mix(pos, (floor(pos * 5. + .5) / 5.), uAngular * .35);     // angular moods snap the cloud to a lattice
  pos.xz *= rot(uSpin);                                       // the cloud's own spin: a nudge per beat, a bigger one on the downbeat
  vec4 cp = uVP * vec4(pos, 1.);
  gl_Position = cp;
  float zc = max(cp.w, .05);                                  // distance along the view axis
  float sz = uRes.y * .0055 * (.55 + 2.4 * amp * amp + uHat * h.y * 1.2 + uKick * .5) / max(zc, .2);
  gl_PointSize = clamp(sz, 1., 48.);
  float bright = (.22 + 3.2 * amp * amp + .7 * uKick * h.z + uDrop) * (.5 + 1.1 * uLevel);
  bright *= min(1., sz) * min(1., 50000. / uCount);           // energy-conserving: sub-pixel points fade, and more particles are each dimmer
  vCol = palM(fx * .9 + h.y * .12 + .1 * length(pos)) * bright * uAlive;
}`;

export const FS_DUST = `#version 300 es
precision mediump float;
in vec3 vCol;
out vec4 o;
void main(){
  vec2 c = gl_PointCoord - .5;
  float d = dot(c, c) * 4.;
  float a = exp(-d * 3.5) - .03;                              // gaussian-ish sprite, clipped so the square never shows
  if (a <= 0.) discard;
  o = vec4(vCol * a, 1.);
}`;
