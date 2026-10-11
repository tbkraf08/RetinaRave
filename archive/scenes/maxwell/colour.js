// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// MAXWELL — the colour field (v0.11 item 2): the wave carries the colour of the note that launched it.
//
// The user, on v0.10: "the color of the wave should match the color associated with the coord/note (it seems to just
// be two colors that switches sometimes?)". It was exactly two: render.js read a soft sign of Ez and mapped it to the
// key's anchor hue and its opposite. The twelve charges glowed in their twelve sector hues, but the field they
// radiated carried no memory of who launched it — Ez is one scalar.
//
// Maxwell's equations are LINEAR in a linear medium, so the field of twelve charges is the sum of twelve fields, and
// a colour-weighted sum C(x,t) = SUM_k rgb_k E_k(x,t) obeys the same wave equation as Ez. That is what this module
// runs: the scalar TE wave equation
//
//     eps d2u/dt2 + sigma du/dt = laplacian(u)
//
// on ONE extra RGBA target pair, channels (r, g, b, w), as a second-order leapfrog
//
//     u_{n+1} = [ 2A u_n - (A - B) u_{n-1} + laplacian(u_n) ] / (A + B),   A = eps / S^2,  B = sigma / (2 S)
//
// and every source injects |amp| * rgb(hue_k) into rgb and |amp| into w. The MAGNITUDE, not the signed carrier: w
// has to stay a non-negative weight or rgb / w is not a chromaticity and the hue explodes wherever w crosses zero.
// What the pair carries is therefore "whose light is here, and how much of it", transported at exactly the speed Ez
// is transported at — which is the whole point: the colour arrives with the wave, it does not follow it.
//
// The display keeps Ez for the physics (the sign and the luminance) and takes the HUE from rgb / max(w, WFL),
// falling back to the anchor below the floor. The sign of Ez is brightness only now: a crest is bright and a trough
// dips to TROUGH of it, so a standing wave still reads as a standing wave without needing a second hue for it.
//
// Cost: the grid is HALF the field's in each direction (GRIDC), so the pass is a quarter of the Yee pair's texels
// and runs once per substep against their two — about an eighth of the field's cost. Hue varies slowly in space, so
// half resolution is invisible at LINEAR magnification. tools/test_fdtd.js gates the scheme (energy bounded, the
// chromaticity rgb/w inside [0,1]) on a 64x64 node twin, as it gates the Yee pair.
//
// Every number is a named constant. The user retunes here.

export const GRIDC = [[128, 72], [192, 108], [256, 144], [384, 216]];   // exactly half of fdtd.js GRIDT
export const CSIG = 0.055;    // the colour field's OWN loss, not the medium's. It has to forget: its sources are
                              // non-negative, so in a lossless cavity (the drop turns sigma off entirely) the pair
                              // would grow without bound, and a colour that remembers the whole track is not the
                              // colour of the note playing now. 0.055 is a memory of about a second.
export const CSRCW = 1.6;     // a charge's blob in COLOUR cells (fdtd SRCW 2.3 at half the resolution, rounded up
                              // because the colour field must not be narrower than the field it colours)
export const CKW = 2.0;       // ... the centre current's (fdtd KW 3.4)
export const CDW = 2.2;       // ... each of the dipole's two (fdtd DIPW 3.6)
export const CCUT = 3.0;      // a blob is evaluated only within this many widths
// How much of the two PITCHLESS sources enters the colour field. Both carry the key's anchor hue (a kick has no
// pitch class), both sit at the centre where the whole picture focuses, and both are far louder than a charge —
// KICKA 0.14 and DIPA 0.030 against CHG 0.0075 — so at full weight the anchor owned every texel and the user's two
// colours were back as one (measured: the hue at the LIT charge's own foot was 0.328 against its own 0.084, and
// every other foot read the anchor exactly). The kick is impulsive and colours its own ring; the dipole radiates
// continuously at the centre and has to be nearly silent here or it paints the whole plane.
export const CDRUM = 0.30;    // the centre current (the kick, and the sub's standing current)
export const CDIP = 0.05;     // the dipole. hooks.mxchroma takes both to zero while it pins: with them on, every
                              // unlit foot reads the anchor 0.379 exactly and the probe is measuring the dipole.
export const WFL = 2e-3;      // below this much w a texel has no colour of its own: the anchor hue shows through
export const WFL1 = 2e-2;     // ... and above this the colour field owns the hue outright
export const CSAT = 1.0;      // how saturated a note's own colour is drawn (times the look's saturation)
export const TROUGH = 0.35;   // the trough of a wave is drawn at this much of the crest's brightness

// The twelve notes' own hues (v0.11 item 2). v0.10 spread them around the KEY's anchor —
// sectorHue(A.hue, k, spread) — so a modulation turned the whole wheel and the same note was a different colour in
// a different key. The user's sentence decides ("the colour of the wave should match the colour associated with the
// coord/note"), so the wheel is pinned at CHUE0 and only the kick, the sub, the dipole and the medium still follow
// the key. And it is drawn WIDER than the look's own spread: a third of the wheel is right for twelve small glows
// on a ring and wrong now that those hues are the colour of every wave in the picture — adjacent notes came out the
// same colour. CSPREAD = 1 is v0.10's spacing exactly.
export const CHUE0 = 0.0;     // where the wheel of twelve is pinned
export const CSPREAD = 1.6;   // how much wider than the look's spread the twelve are drawn ...
export const CSPMAX = 0.92;   // ... capped just under a full turn, so the two ends of the wheel never meet
export function noteHues(out, spread, pure) {
  const sp = Math.min(CSPMAX, CSPREAD * spread) * pure;
  for (let k = 0; k < 12; k++) out[k] = CHUE0 + sp * (k / 12 - 0.5);
  return out;
}

const BLOBC = `
float blobC(vec2 p, vec2 c, float w) {
  vec2 d = p - c;
  float q = dot(d, d);
  if (q > ${(CCUT * CCUT).toFixed(1)} * w * w) return 0.0;
  return exp(-q / (2.0 * w * w));
}
vec3 hueC(float h) { return 0.5 + 0.5 * cos(TAU * (h + vec3(0.0, 0.33, 0.67))); }
`;

// One substep of the colour field. Reads u_n and u_{n-1}, writes u_{n+1}; the caller swaps the two targets.
export const FS_C = `
uniform sampler2D uU;     // u_n
uniform sampler2D uP;     // u_{n-1}
uniform sampler2D uM;     // the medium (the FULL grid): R eps, G sigma, B the conductor mask
uniform vec2 uSz;         // the colour grid in cells
uniform float uS;         // its Courant number: the field's S halved, because its cells are twice as wide
uniform vec2 uCtr;        // the centre, in colour cells
uniform vec2 uJ;          // |the centre current| and |the dipole's| this substep
uniform vec4 uDip;        // the dipole's axis (unit) and its half-separation in colour cells
uniform vec3 uAC;         // the anchor's rgb — the kick, the sub and the dipole have no pitch class
uniform float uCX[12];
uniform float uCY[12];
uniform float uCA[12];    // |a charge's amp| this substep
uniform float uCH[12];    // ... and its hue
uniform vec2 uRing;       // the charges' ring: its radius in colour cells and how far the blobs reach
${BLOBC}
void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  ivec2 hi = ivec2(uSz) - 1;
  vec4 u0 = texelFetch(uU, p, 0);
  vec4 um = texelFetch(uP, p, 0);
  vec4 lap = texelFetch(uU, ivec2(min(p.x + 1, hi.x), p.y), 0) + texelFetch(uU, ivec2(max(p.x - 1, 0), p.y), 0)
           + texelFetch(uU, ivec2(p.x, min(p.y + 1, hi.y)), 0) + texelFetch(uU, ivec2(p.x, max(p.y - 1, 0)), 0)
           - 4.0 * u0;
  vec4 md = texture(uM, gl_FragCoord.xy / uSz);
  float A = max(md.r, 0.25) / (uS * uS);
  float B = ${CSIG.toFixed(4)} / (2.0 * uS);
  vec4 un = (2.0 * A * u0 - (A - B) * um + lap) / (A + B);
  vec4 src = vec4(0.0);
  float rr = length(gl_FragCoord.xy - uCtr);
  if (abs(rr - uRing.x) < uRing.y) {
    for (int k = 0; k < 12; k++) {
      if (uCA[k] > 1e-7) src += uCA[k] * blobC(gl_FragCoord.xy, vec2(uCX[k], uCY[k]), ${CSRCW.toFixed(2)}) * vec4(hueC(uCH[k]), 1.0);
    }
  }
  if (uJ.x > 1e-7) src += uJ.x * blobC(gl_FragCoord.xy, uCtr, ${CKW.toFixed(2)}) * vec4(uAC, 1.0);
  if (uJ.y > 1e-7) {
    vec2 d = uDip.xy * uDip.z;
    src += uJ.y * (blobC(gl_FragCoord.xy, uCtr + d, ${CDW.toFixed(2)}) + blobC(gl_FragCoord.xy, uCtr - d, ${CDW.toFixed(2)})) * vec4(uAC, 1.0);
  }
  un += src;
  un *= 1.0 - md.b;
  if (p.x == 0 || p.y == 0 || p.x == hi.x || p.y == hi.y) un = vec4(0.0);
  // Both clamps are the same statement: rgb is a SHARE of w. Every source obeys rgb_k <= 1 per channel, so each
  // contribution to rgb is at most its contribution to w — but the wave operator is linear and not
  // positivity-preserving, so a texel where the Green's function is negative can come back with rgb > w or with w
  // clamped to zero under a positive rgb, and rgb/w is then not a chromaticity at all (measured on the node twin:
  // the ratio reached 2950 without this). Projecting back onto 0 <= rgb <= w costs one min and one max.
  un = max(un, vec4(0.0));
  o = vec4(min(un.rgb, vec3(un.a)), un.a);
}
`;

// --- the module's own state: index.js only builds, steps, binds and clears it ------------------------------------
//
// THREE targets, not two. A second-order leapfrog reads u_n AND u_{n-1} and writes u_{n+1}, and a fragment shader
// cannot read the texture it writes — so this cannot be the two-target ping-pong the Yee pair is (that one gets
// away with two because each of its passes reads one field and writes the other). The three rotate: the oldest is
// always the one written into.
let CTX = null, MK = null, prC = null, C0 = null, C1 = null, C2 = null, CW = 0, CH = 0;
const AX = new Float32Array(12), AY = new Float32Array(12), AA = new Float32Array(12);

export function initColour(ctx, mk) {
  CTX = ctx;
  MK = mk;
  prC = ctx.mkProg(FS_C, 'maxwell-colour');
}

// The three, at the tier's colour grid. LINEAR at display (hue varies slowly and the grid is half); mk() leaves
// NEAREST, which is right for the Yee pair's texelFetch and wrong here, so the filters are set again.
export function buildColour(tier) {
  const ctx = CTX, gl = ctx.gl, G = GRIDC[Math.max(0, Math.min(3, tier))];
  freeColour();
  CW = G[0];
  CH = G[1];
  C0 = MK(ctx, CW, CH);
  C1 = MK(ctx, CW, CH);
  C2 = MK(ctx, CW, CH);
  for (const t of [C0, C1, C2]) {
    gl.bindTexture(gl.TEXTURE_2D, t.t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  }
  gl.bindTexture(gl.TEXTURE_2D, null);
  return [CW, CH];
}

export function freeColour() {
  for (const t of [C0, C1, C2]) if (t) CTX.freeTarget(t);
  C0 = C1 = C2 = null;
}

export function clearColour() {
  if (!C0) return;
  const g = CTX.gl;
  for (const t of [C0, C1, C2]) {
    g.bindFramebuffer(g.FRAMEBUFFER, t.f);
    g.clearColor(0, 0, 0, 0);
    g.clear(g.COLOR_BUFFER_BIT);
  }
  g.bindFramebuffer(g.FRAMEBUFFER, null);
}

export const colourTex = () => C0;
export const colourSize = () => [CW, CH];

// One substep, driven by the same source bookkeeping the Yee pair is driven by. `S` is the FIELD's Courant number;
// a colour cell is 1/sc field cells wide, so the colour field's own is S*sc and the two waves travel at one speed.
//   sc    the field -> colour cell scale (CW / gw) · med the medium target · ctr the centre in FIELD cells
//   ring  the charges' ring radius in field cells · reach how far a charge's blob reaches · dipD the dipole's half
//   SRC   the sources module · hues the twelve hues · ac the anchor's rgb · drums 0 silences the pitchless two
export function stepColour(S, med, sc, ctr, ring, reach, dipD, SRC, hues, ac, drums) {
  if (!C0) return;
  const ctx = CTX, g = ctx.gl;
  for (let k = 0; k < 12; k++) {
    AX[k] = SRC.CX[k] * sc;
    AY[k] = SRC.CY[k] * sc;
    AA[k] = Math.abs(SRC.CA[k]);
  }
  ctx.use(prC, C2, CW, CH);
  ctx.tex(prC, 'uU', 0, C0);
  ctx.tex(prC, 'uP', 1, C1);
  ctx.tex(prC, 'uM', 2, med);
  g.uniform2f(prC.u('uSz'), CW, CH);
  g.uniform1f(prC.u('uS'), S * sc);
  g.uniform2f(prC.u('uCtr'), ctr[0] * sc, ctr[1] * sc);
  const dr = drums === undefined ? 1 : drums;
  g.uniform2f(prC.u('uJ'), dr * CDRUM * Math.abs(SRC.OUT.j), dr * CDIP * Math.abs(SRC.OUT.dj));
  g.uniform4f(prC.u('uDip'), SRC.OUT.dx, SRC.OUT.dy, dipD * sc, 0);
  g.uniform3f(prC.u('uAC'), ac[0], ac[1], ac[2]);
  g.uniform1fv(prC.u('uCX[0]'), AX);
  g.uniform1fv(prC.u('uCY[0]'), AY);
  g.uniform1fv(prC.u('uCA[0]'), AA);
  g.uniform1fv(prC.u('uCH[0]'), hues);
  g.uniform2f(prC.u('uRing'), ring * sc, reach * sc);
  ctx.tri();
  const t = C1;            // C2 holds u_{n+1}: it becomes u_n, the old u_n becomes u_{n-1}, the oldest is scratch
  C1 = C0;
  C0 = C2;
  C2 = t;
}
