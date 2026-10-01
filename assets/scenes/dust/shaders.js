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
//
// §57 step 3: the tension the scene used to shrink with was `tension`, v3's ROUGHNESS — how dissonant the music is,
// which on a clean dubstep track sits around 0.35 all day and reads as a build that never arrives. The real build is
// the void, `buildLive` (§54): uBuild.x pulls the whole cloud in, thins the torus's tube and (CPU side) drains the
// palette and tightens the fibre rings; uBuild.y is the drop's release, which lets all of it go at once and leaves
// the fling to uDrop. uTension is now the jitter and nothing else.

export const VS_DUST = `#version 300 es
precision highp float;
precision highp int;
#define TAU 6.2831853
#define PI 3.14159265

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
uniform vec2 uSnareR;      // the snare's flash ring: radius in scene units, gaussian half-width. The radius starts
                           // at the CURRENT shape's mid-band radius (formations.js MIDR) and travels out from there,
                           // so the ring lands on the body on the hit's own frame in every formation (§58 task A).
uniform float uDrop;       // MS.dropEnv
uniform float uTension;    // MS.tension — the roughness, as JITTER and nothing else
uniform vec2 uBuild;       // x = the void's contraction 0..1 (buildLive + the last bar's wind-up), y = the release
uniform float uDyn;        // the dynamic range, 0..1: the engine's TRUE loudness against the TRACK's own peak, through
                           // math/loudlight.js (dyn.js, §65; &loud=0 falls back to §60's eM/peak). It is the
                           // cloud's BASE brightness, grain size and overall radius; the hits ride on top of it and
                           // barely move with it, so a quiet section's kick is still a kick.
uniform float uAlive;      // MS.alive
uniform float uHue;        // LOOK.mood.hue
uniform float uSat;        // LOOK.mood.sat
uniform float uBri;        // LOOK.mood.bri
uniform float uSpread;     // LOOK.mood.spread
uniform float uInvert;     // LOOK.mood.invert
uniform float uAngular;    // LOOK.mood.angular
uniform sampler2D uSpec;   // 256x1 log spectrum: each particle owns one bin
uniform sampler2D uWave;   // 512x1 waveform: the ribbon formation is literally the waveform
uniform sampler2D uEma;    // 256x1 SLOW spectrum: the same bins, averaged over 1.2 s (habit.js). A grain answers to
                           // its bin's level MINUS this, so a sustained sound habituates and a new one is fresh.
uniform sampler2D uNorm;   // 1x1: the RMS of the habituation gain over the bins THIS FRAME (habit.js FS_NORM).
                           // Dividing by it is what makes the habituation redistribute the cloud's light between
                           // the steady bands and the changing ones instead of changing how much there is.
uniform vec3 uHab;         // x = the habituation on/off (hooks.hab, the A/B), y = the floor a sustained band
                           // habituates TO, z = the step in the spectrum that counts as fully new

out vec3 vCol;

float hash11(float p){ p = fract(p * .1031); p *= p + 33.33; p *= p + p; return fract(p); }
mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float spec(float x){ return texture(uSpec, vec2(clamp(x, 0.002, 0.998), .5)).r; }
float slow(float x){ return texture(uEma, vec2(clamp(x, 0.002, 0.998), .5)).r; }
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
//
// §58 task A: A GRAIN'S BAND IS ITS PLACE. h.x is the rank of the bin a grain owns — uniform on 0..1, and fx
// (the bin itself) is a monotone function of it — so the rank is the one coordinate every shape can share. Each
// formation turns it into a radius the way its own DIMENSION keeps its density: the galaxy's sqrt(rank) is uniform
// per unit AREA (§57's own line, and the shape this task was told to make the others match — unchanged here), a ball
// is uniform per unit VOLUME at cbrt(rank), a line is uniform per unit LENGTH at the rank itself, and the torus's
// tube is already flat in its own angle, so the rank goes straight onto it. The result is that in all four shapes the
// low bins are the CORE, the mids the BODY and the highs the RIM: the kick's shove, the snare's ring and the hat's
// sparkle are three places as well as three bands (CONTRACTS §1.18, one element one channel). MIDR in formations.js
// is where each shape's mid band sits, which is where the snare's ring is launched from.
vec3 form(int k, float n, vec3 h, float id){
  // 0: Fibonacci sphere — y sweeps the poles linearly (equal-area bands) and the azimuth advances by the
  //    golden angle 2pi/phi^2 = 2.39996 rad per particle, which is the most irrational turn there is,
  //    so no two particles ever line up into a seam. The DIRECTION is still that lattice-free set; the RADIUS is the
  //    grain's band rank, cube-rooted, so the ball is of even density and the low bins are its nucleus.
  if (k == 0){ float y = 1. - 2. * n, rr = sqrt(max(0., 1. - y * y)), ph = id * 2.39996;
               return vec3(cos(ph) * rr, y, sin(ph) * rr) * (1.05 * (.05 + .95 * pow(h.x, 1. / 3.))); }
  // 1: torus — (R + r cos v) around the main circle u, r sin v up the tube; r breathes with the slow bass.
  //    u turns with the beat, a little faster than the cloud around it, so the ring reads as the thing being nudged,
  //    and the tube thins to a wire through the void before a drop (uBuild.x) — the build IS the ring tightening.
  //    The tube angle v is the band rank: the low bins ride the INNER wall of the tube (v = +-pi, radius R - r) and
  //    the highs its outer wall (v = 0, R + r), with a small dither and a slow breath left on mid time.
  if (k == 1){ float sg = h.y < .5 ? -1. : 1.;
               float u = TAU * h.z + uSpin * .7, v = sg * (PI * (1. - h.x) + (fract(h.y * 2.) - .5) * .45 + uFlowMid * .05);
               float R = 1.1, rr = max(.06, .38 + .2 * uBassS - .26 * uBuild.x);
               return vec3((R + rr * cos(v)) * cos(u), rr * sin(v), (R + rr * cos(v)) * sin(u)); }
  // 2: three-arm galaxy — radius is sqrt-distributed (uniform area), the arm is a log-ish spiral whose
  //    winding rate falls off as 1/(r + .35) so the core turns faster than the rim. It winds per beat, so every
  //    beat shears the arms a little — most in the core, least at the rim, which is what a spiral arm is.
  if (k == 2){ float rr = sqrt(h.x) * 1.7 + .05; float arm = floor(h.y * 3.) / 3. * TAU; float an = rr * 2.6 + arm + uSpinG / (rr + .35) + (h.z - .5) * .5;
               return vec3(cos(an) * rr, (h.z - .5) * .22 / (rr + .4), sin(an) * rr); }
  // 3: the waveform itself as a twisting ribbon. A grain's place ALONG it is its band rank, mirrored about the middle,
  //    so the low bins are the centre of the ribbon and the highs its two ends — and the wave is sampled where the
  //    grain actually is, so the ribbon is still literally the waveform.
  float x = (h.z < .5 ? -1. : 1.) * (.02 + .98 * h.x); float w = wave(.5 + .5 * x);
  vec3 pz = vec3(x * 1.9, w * .75 * (.4 + uLevel), (fract(h.z * 2.) - .5) * .12 + (h.y - .5) * .5 * uMidS);
  pz.yz *= rot(x * 2.5 + uFlowMid * .4);
  return pz;
}

void main(){
  float id = float(gl_VertexID), n = id / uCount;
  vec3 h = vec3(hash11(id * 1.31 + 1.), hash11(id * 2.17 + 7.), hash11(id * 3.73 + 13.));
  float fx = pow(h.x, 1.4) * .95;                             // more particles own the low bins
  // §60 step 2: NOVELTY. raw is this particle's band right now; slow(fx) is the same band averaged over 1.2 s
  // (habit.js), so nov is how much of an ONSET the band is showing — an absolute step of uHab.z of full scale,
  // because the spectrum is peak-normalised and its bins' resting levels differ. A sustained sound's average
  // catches up with it and the grain settles back to uHab.y of a fully novel one — never to nothing. The three
  // transient voices below are driven by the onsets' ages, not by this, so a habituated pad cannot dim a kick.
  float raw = spec(fx);
  float nov = clamp((raw - slow(fx)) / uHab.z, 0., 1.);
  float nrm = max(texture(uNorm, vec2(.5)).r, uHab.y);
  float amp = raw * mix(1., (uHab.y + (1. - uHab.y) * nov) / nrm, uHab.x);
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
  pos += dir * kick * .5 * (.3 + .7 * R);                     // ...in PROPORTION to where the grain is: a fixed half a
  // unit was most of the core's own radius, so a kick emptied the core out of the middle of the frame instead of
  // swelling it (§58 task A: the low bins are the core now, so the shove has to leave them there).
  pos += dir * uVoice.w * .3 * wLow * wLow;                   // the sub swells the core while it sounds
  float ring = uVoice.y * (.2 + .8 * wMid) * exp(-pow((R - uSnareR.x) / max(uSnareR.y, .02), 2.));
  pos += dir * ring * .38;                                    // the snare's flash ring, travelling out
  float spark = uVoice.z * wHigh * (.35 + 1.5 * h.y);         // the hat sparkles the edge

  // the whole swarm's radius. R above was taken BEFORE this line, so the snare ring's own radius is unaffected.
  pos *= (1. - .3 * uBuild.x + .17 * uBuild.y + uDrop * 1.6 * h.y * h.y + .1 * uBassS) * (.82 + .18 * uDyn);
  pos += (h - .5) * .5 * uTension * sin(uFlow * 40. + id) * .12;   // roughness: jitter, and nothing else
  pos = mix(pos, (floor(pos * 5. + .5) / 5.), uAngular * .35);     // angular moods snap the cloud to a lattice
  pos.xz *= rot(uSpin);                                       // the cloud's own spin: a nudge per beat, a bigger one on the downbeat
  vec4 cp = uVP * vec4(pos, 1.);
  gl_Position = cp;
  float zc = max(cp.w, .05);                                  // distance along the view axis
  // DYNAMIC RANGE (§60 step 1). The base — the grain's own band and the ambient floor — carries the range; the
  // three voices and the sub ride on top of it and barely move with it. gBase lands on 1.47 at the groove's own
  // dyn, which is what the old (.5 + 1.1 * uLevel) gave there (lvl p50 .882), so the groove is unchanged and
  // everything quieter than the groove falls away from it. uLevel no longer gates the light at all: it is
  // AGC-normalised and a quiet verse was as bright as the drop.
  float gBase = .22 + 1.42 * uDyn, gHit = 1.05 + .45 * uDyn, gSz = .55 + .45 * uDyn;
  float sz = uRes.y * .0055 * ((.55 + 2.4 * amp * amp) * gSz + spark * 2.2 + kick * 1. + ring * 3.) / max(zc, .2);
  gl_PointSize = clamp(sz, 1., 48.);
  float bright = (.22 + 3.2 * amp * amp) * gBase
    + (1.5 * kick + 4. * ring + 1.8 * spark + .5 * uVoice.w * wLow + uDrop) * gHit;
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
