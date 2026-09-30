// DUST — GPU particle swarm lifted from synapse scene 4 ("swarm").
// No vertex buffer: every particle is derived from gl_VertexID, so the whole cloud is one drawArrays(POINTS).
// The helpers below (hash11, rot, spec, wave, palM) are the GLSL_COMMON functions this scene actually uses,
// copied in rather than shared — HEAD is not prepended to a raw two-source program.
//
// §57 step 1: the cloud's spin, the torus's main turn and the galaxy's winding arrive as ONE angle computed on the
// beat grid (uSpin / uSpinG, grid.js) instead of three rates read off the flow clocks. uFlow is left with the one
// job it can keep: the phase of the roughness jitter, where a musical-time scramble is exactly what is wanted.
//
// §57 step 2: three transient voices, separated by the BAND a grain owns, so a reader can tell the drums apart
// (§1.18 "one musical element, one visual channel"). uVoice carries the four envelopes voices.js shapes from the
// onsets' ages: the kick shoves the inner grains outward, the snare launches a flash RING that travels out through
// the mid grains (uSnareR), the hat sparkles the edge, and a sub note swells the core. uKick / uHat are gone —
// the scene reads the reactive drums v2 now (kick2 / snare2 / hat2, §51).

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
uniform vec4 uVoice;       // the four voices' envelopes: kick, snare, hat, sub (voices.js)
uniform vec2 uSnareR;      // the snare's flash ring: radius in scene units, gaussian half-width
uniform float uDrop;       // MS.dropEnv
uniform float uTension;    // MS.tension
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
  // Which drum a grain answers to is the band it owns. wLow: the inner, low-bin grains the kick and the sub move.
  // wMid: a band around the snare's body. wHigh: the edge grains the hats live on. The three barely overlap, so
  // the three voices are separable on screen instead of all brightening the same cloud.
  float wLow = 1. - smoothstep(.06, .34, fx);
  float wMid = exp(-pow((fx - .46) / .24, 2.));
  float wHigh = smoothstep(.52, .95, fx);
  // formation cross-fade, staggered per particle so the cloud pours from one shape into the next
  vec3 pos = mix(form(int(uForm.x), n, h, id), form(int(uForm.y), n, h, id), smoothstep(0., 1., clamp(uForm.z * 1.4 - h.z * .4, 0., 1.)));
  pos += .16 * (uMidS + .1) * sin(pos.yzx * 3.1 + uFlowMid * .9 + h.y * TAU);
  vec3 dir = normalize(pos + 1e-4);
  pos += dir * amp * .55 * (.3 + uLevel);                     // each particle pushed out by its own band
  float R = length(pos);

  // the three transient voices, each on its own band and each placed by its onset's age (voices.js)
  float kick = uVoice.x * wLow * (.55 + .9 * h.z);            // a shove outward through the inner grains
  pos += dir * kick * .5;
  pos += dir * uVoice.w * .3 * wLow * wLow;                   // the sub swells the core while it sounds
  float ring = uVoice.y * wMid * exp(-pow((R - uSnareR.x) / max(uSnareR.y, .02), 2.));
  pos += dir * ring * .38;                                    // the snare's flash ring, travelling out
  float spark = uVoice.z * wHigh * (.35 + 1.5 * h.y);         // the hat sparkles the edge

  pos *= 1. + uDrop * 1.6 * h.y * h.y - .2 * uTension + .1 * uBassS;
  pos += (h - .5) * .5 * uTension * sin(uFlow * 40. + id) * .12;   // jitter as tension rises
  pos = mix(pos, (floor(pos * 5. + .5) / 5.), uAngular * .35);     // angular moods snap the cloud to a lattice
  pos.xz *= rot(uSpin);                                       // the cloud's own spin: a nudge per beat, a bigger one on the downbeat
  vec4 cp = uVP * vec4(pos, 1.);
  gl_Position = cp;
  float zc = max(cp.w, .05);                                  // distance along the view axis
  float sz = uRes.y * .0055 * (.55 + 2.4 * amp * amp + spark * 2.2 + kick * 1. + ring * 3.) / max(zc, .2);
  gl_PointSize = clamp(sz, 1., 48.);
  float bright = (.22 + 3.2 * amp * amp + 1.5 * kick + 4. * ring + 1.8 * spark + .5 * uVoice.w * wLow + uDrop) * (.5 + 1.1 * uLevel);
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
