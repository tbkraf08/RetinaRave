// FEIGEN's COLOUR pass (v0.2 §16, recoloured in OKLCH in v0.3 §19) — the music, every frame, one texture read of the
// field plus a few of spec/hist.
//
// The camera of the frame maps each pixel to a point of parameter space exactly as the §15 shader did
// (p = (gl_FragCoord.xy - .5*uRes)/uRes.y, dc = centre + (p * rot) * width), and the field pass' answer at that
// point is fetched out of the current rung.
//
// Two details of the fetch that are not in the §15 shader:
//  · the fetch is a MANUAL bilinear of four texelFetch()es, because two of the four channels must not be blended
//    linearly — the escape angle wraps (blended as a unit vector) and the interior/exterior sign must not be
//    interpolated at all (where the four signs disagree the nearest texel is taken alone).
//  · each of the four texels is DECODED FIRST and the decoded quantities are what get blended. log d and log2 G are
//    continuous functions of c; the raw n and log|z'| are not (both jump by a doubling across an escape-count
//    contour, and only their combination is continuous), so interpolating the raw channels would draw a seam along
//    every contour. Same arithmetic, one order later.
//
// A second rung can be sampled at the same time with its own rectangle and its own camera (uField2 / uRect2 /
// uCentre2 / uWidth2) and cross-faded IN FIELD SPACE by uBlend: a rung change and the arrival of a rung that was
// standing in are both resolution fades of the same mathematics, never two coloured pictures ghosting over another.
//
// THE COLOURING (v0.3 §19). dec() hands this pass the three exterior coordinates the mathematics actually has —
// the Green's potential, the external angle, the distance estimate — so they are written to the three coordinates
// of a perceptual colour space instead of through a cosine palette in gamma sRGB (whose "hue" changes lightness by
// 2x around the wheel):
//   H <- the external angle ea      external rays are iso-hue lines; a wake, a Misiurewicz point, a bulb's root are
//                                   read off the picture as the places where the hues pinch. One turn of ea is one
//                                   turn of hue, so the wrap at ea = 0 is invisible and the rung blend (which
//                                   blends ea as a unit vector) stays continuous in hue.
//   L <- log2 G, compressed         the potential's level sets are iso-lightness. -lG is the number of doublings of
//                                   G below 1 (= n - log2 ln r), which runs into the hundreds on a deep visit, so
//                                   it goes through sqrt + tanh: nothing saturates to black or white at &feig=3.6.
//   C <- the distance estimate      chroma, not lightness, carries the boundary, so it stays crisp at any depth.
//                                   Under half a pixel of DE the colour goes achromatic AND the lightness goes to
//                                   0: the black edge is the field's own distance estimate, not a filter.
// palOK (ctx.oklch, CONTRACTS §1.14) clips by shrinking chroma toward grey at the same L, so a colour can never be
// clamped per channel — and cMax() below keeps every pixel inside the gamut to begin with, so it never clips at all.
// The chain still expects encoded values, so the result is written through linToSrgb (a later core phase moves the
// chain to linear light and this encode goes away). The music is exactly where §15 put it, but on L, not on RGB.
export const FS_COLOUR = `
uniform sampler2D uField;
uniform sampler2D uField2;
uniform sampler2D uSpec;
uniform sampler2D uHist;
uniform vec4 uRect;
uniform vec4 uRect2;
uniform vec2 uSz;
uniform vec2 uSz2;
uniform vec2 uCentre;
uniform vec2 uCentre2;
uniform float uWidth;
uniform float uWidth2;
uniform float uBlend;
uniform float uRot;
uniform float uHistRow;
uniform float uLevel;
uniform float uKick;
uniform float uDrop;
uniform float uHat;
uniform float uFlow;
uniform float uMidS;
uniform float uTension;
uniform float uAlive;
uniform float uHue;
uniform float uSat;
uniform float uBri;
uniform float uInvert;
uniform float uClipDbg;   // #test only (hooks.clipdbg): 1 = write okClip into o.r, 2 = write the raw field probe
#ifdef HUECO
// #test only (hooks.hueco, the v0.3 hue-follows-the-set probe): WHICH COORDINATE DRIVES HUE. 1 = the Green's potential
// (level sets = iso-hue: the colour follows the boundary's contours), 2 = the scale-free distance estimate (bands
// parallel to the boundary); 0 is the shipped external angle. index.js prepends the #define ONLY when the hook is set,
// so at hueco 0 the preprocessor deletes every line of the probe and the shipped pass compiles from the shipped token
// stream — byte-identical by construction, not by the optimiser's good will.
// On 1 and 2 the lightness is capped at 0.5 and the chroma is the FULL okCmax(L) budget, because the user's "the
// colours don't match the set" was seen at L 0.7 under the linear tonemap (§24): a pale field would confound the hue
// question with a lightness question.
uniform int uHueCo;
const float K_G = 0.1;    // hue turns per unit of log2 G: one turn per 10 doublings of the potential (see the report)
const float K_D = 0.25;   // hue turns per octave of the scale-free distance: one turn per 4 octaves
#endif

// the engine's 256x1 log spectrum, 30 Hz .. 16 kHz, peak-normalised
float specM(float x){ return texture(uSpec, vec2(clamp(x, 0.002, 0.998), 0.5)).r; }
// the 256x128 spectrogram ring: uHistRow is "now" (the next row to be written, minus half a texel), age goes back in
// time in rows/128 (~1.3 s of past); the T wrap is REPEAT, so the subtraction needs no modulo
float histM(float x, float age){ return texture(uHist, vec2(clamp(x, 0.003, 0.997), uHistRow - clamp(age, 0., 0.96))).r; }
// The largest chroma that is inside sRGB at this lightness FOR EVERY HUE, capped at the 0.11 of CONTRACTS §1.14.
// assets/math/oklab.js's maxChroma, minimised over hue, is 0.170*L below L 0.75 (the tightest hue is 200 degrees at
// every L) and falls to 0 at L 1; 0.11*min(1, 1.4L, 4(1-L)) is under that envelope at every L (worst ratio 1.06).
// Chroma therefore never has to be clipped: okClip is 1 on every pixel, which is what hooks.clipdbg=1 counts.
float cMax(float L){ return 0.11 * min(1., min(1.4 * L, 4. * (1. - L))); }

// one field texel -> (log d, log2 G, escape angle, interior trap). lw = log of the view width this pixel is measured
// against, so d is dimensionless and the dive stays scale-free exactly as in §15.
vec4 dec(vec4 f, float lw){
  float l2 = log2(max(f.y, 1e-6));
  return vec4(f.y + l2 * 0.69314718 - f.z - lw, l2 - f.x, f.w, max(-f.x - 1., 0.));
}

void sampleF(sampler2D T, vec4 R, vec2 SZ, vec2 dc, float lw, out vec4 v, out float esc){
  float fx = clamp((dc.x - R.x) / (R.y - R.x) * SZ.x - 0.5, 0., SZ.x - 1.);
  float fy = clamp(abs(dc.y) / R.z * SZ.y - 0.5, 0., SZ.y - 1.);   // |y|: the field is the upper half-plane only
  ivec2 i0 = ivec2(floor(fx), floor(fy));
  ivec2 i1 = min(i0 + ivec2(1), ivec2(SZ) - ivec2(1));
  vec2 fr = vec2(fx, fy) - vec2(i0);
  vec4 a = texelFetch(T, i0, 0);
  vec4 b = texelFetch(T, ivec2(i1.x, i0.y), 0);
  vec4 c = texelFetch(T, ivec2(i0.x, i1.y), 0);
  vec4 d = texelFetch(T, i1, 0);
  float sa = step(0., a.x), sb = step(0., b.x), sc = step(0., c.x), sd = step(0., d.x);
  if (sa != sb || sa != sc || sa != sd) {          // a boundary texel: interior and exterior do not average
    vec4 nr = fr.x < 0.5 ? (fr.y < 0.5 ? a : c) : (fr.y < 0.5 ? b : d);
    esc = step(0., nr.x);
    v = dec(nr, lw);
    return;
  }
  esc = sa;
  vec4 A = dec(a, lw), B = dec(b, lw), C = dec(c, lw), D = dec(d, lw);
  float w0 = (1. - fr.x) * (1. - fr.y), w1 = fr.x * (1. - fr.y), w2 = (1. - fr.x) * fr.y, w3 = fr.x * fr.y;
  v = w0 * A + w1 * B + w2 * C + w3 * D;
  float ss = w0 * sin(TAU * A.z) + w1 * sin(TAU * B.z) + w2 * sin(TAU * C.z) + w3 * sin(TAU * D.z);
  float cc = w0 * cos(TAU * A.z) + w1 * cos(TAU * B.z) + w2 * cos(TAU * C.z) + w3 * cos(TAU * D.z);
  v.z = fract(atan(ss, cc) / TAU + 1.);            // the angle wraps: blend it as a unit vector, not as a number
}

void main(){
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  mat2 M = rot(uRot);
  vec2 dc = uCentre + (p * M) * uWidth;
  vec4 v; float esc;
  sampleF(uField, uRect, uSz, dc, log(uWidth), v, esc);
  if (uBlend > 0.) {
    vec4 v2; float e2;
    sampleF(uField2, uRect2, uSz2, uCentre2 + (p * M) * uWidth2, log(uWidth2), v2, e2);
    if (e2 == esc) {
      float ss = mix(sin(TAU * v.z), sin(TAU * v2.z), uBlend), cc = mix(cos(TAU * v.z), cos(TAU * v2.z), uBlend);
      v = mix(v, v2, uBlend);
      v.z = fract(atan(ss, cc) / TAU + 1.);
    } else if (uBlend > 0.5) { v = v2; esc = e2; }
  }
  vec3 hlc;        // the (hue, lightness, chroma) this pixel asked for — what hooks.clipdbg=1 re-checks
  vec2 gd = vec2(0., -24.);   // (-log2 G, log2 of the scale-free DE) — what hooks.clipdbg=2 reads back
  if (esc > 0.5) {
    // distance to M in units of the view width: scale-free, so the dive can loop on the cascade's self-similarity.
    // One pixel is uWidth/uRes.y in parameter units, so d*uRes.y IS the distance estimate in pixels.
    float d = exp(v.x), lG = v.y, ea = v.z, dpx = d * uRes.y;
    float sp = specM(abs(fract(ea) * 2. - 1.) * 0.9);
    // H: the external angle, one turn for one turn. The mood rotates the whole wheel; a drop turns it by half.
    float H = ea + uHue + 0.5 * uInvert;
    // L: the DISTANCE, not the potential. d is already divided by the view width, so it carries the dive's
    // self-similarity: the same shape of view has the same d at every depth, and the grade never moves under the
    // fall. The open field sits at 0.5 (0.72 in the worker's pass on the encoded chain; the linear chain's tonemap
    // lifts mid-tones, and 0.72 came out near white on screen — §20/§24) and darkens into the set. KD is chosen on
    // the montage (see the report): it is the reciprocal of the d that half-darkens.
    float L = 0.5 * (1. - exp(-d * 200.));
    // the Green's level sets: one band per doubling of G, drifting outward on musical time, as a +-0.08 ripple of
    // lightness on top of the distance grade (§15's band term, same lG, same uFlow, same sp^2 / uHat amplitude)
    float band = 1. - smoothstep(0., 0.1, abs(fract(lG * 0.5 - uFlow * 0.3) - 0.5) - 0.4);
    L += (2. * band - 1.) * 0.08 * min(1.5, 0.6 + 0.6 * sp * sp + 0.5 * uHat);
    // the spectrogram's past drifts off the boundary: the further out, the older the row. It darkens the bright
    // field rather than lifting it, so it cannot push the exterior out of its chroma budget.
    L -= histM(abs(fract(ea * 2.) * 2. - 1.), clamp(d * 1.5, 0., 0.9)) * exp(-d * 6.) * 0.20 * uMidS;
    // the music rides lightness, never the encoded colour. The level and the mood's own brightness scale it, but
    // only to 1.02, so the field stays in the L band where the chroma budget is full; the kick and the drop lift
    // TOWARD white by <= .15 and <= .25 of the remaining headroom, so no gain can ever take a channel past 1.
    L *= clamp(mix(1., uBri, 0.4) * (0.92 + 0.14 * uLevel), 0.65, 1.02);
    L += (0.15 * uKick + 0.25 * uDrop) * (1. - clamp(L, 0., 1.));
    // the boundary: under half a pixel of DE the lightness goes to 0. Bass narrows that edge (§15's filament
    // sharpening, which was the same mix(160, 70, bass) on the same d).
    L *= smoothstep(0., mix(0.65, 0.38, uBands.x), dpx);
    L = clamp(L, 0., 1.);
    hlc = vec3(H, L, cMax(L) * smoothstep(0.35, 2.5, dpx) * uSat);
#ifdef HUECO
    if (uHueCo != 0) {                               // the hue-coordinate probe (see uHueCo above)
      float Hc = uHueCo == 1 ? K_G * lG + uHue : K_D * log2(max(d, 1e-7)) + uHue;
      float Lc = min(L, 0.5);
      hlc = vec3(Hc, Lc, cMax(Lc));
    }
#endif
    gd = vec2(-lG, log2(max(d, 1e-7)));
  } else {
    float t = v.w;   // orbit trap inside the set: how near the orbit passed the origin
    // §15's interior brightness, read as a lightness: for a grey L = Y^(1/3) and Y ~ enc^2.4, so an encoded value
    // enc is the lightness enc^0.8 — the interior keeps the weight it had. Hue half a turn off the mood, low chroma.
    float b = (0.03 + 0.22 * uBands.x * exp(-t * 2.) + 0.12 * uTension) * (0.4 + uLevel) * uBri;
    float L = pow(clamp(b, 0., 1.), 0.8);
    hlc = vec3(uHue + 0.5, L, cMax(L) * 0.5 * uSat);
  }
  if (uClipDbg > 0.5) {                            // #test only: the gamut and field probes, never a shipped pixel
    o = uClipDbg < 1.5 ? vec4(okClip(hlc.x, hlc.y, hlc.z), 1., 1., 1.)
                       : vec4(clamp(gd.x / 512., 0., 1.), clamp((gd.y + 24.) / 24., 0., 1.), esc, 1.);
    return;
  }
  o = vec4(linToSrgb(palOK(hlc.x, hlc.y, hlc.z)) * uAlive, 1.);
}
`;
