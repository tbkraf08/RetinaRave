// MAXWELL — the two Yee-grid kernels (step 1 of docs/workers/brief-maxwell.md) and the ping-pong they run in.
//
// TE mode in two dimensions: Ez on the cell centres, Hx on the (i, j+1/2) edges, Hy on the (i+1/2, j) edges — the
// Yee 1966 staggering. One substep is two fragment passes over one RGBA16F (RGBA32F where the GPU renders it) target:
//
//   Faraday   dB/dt = -curl E - M      Hx -= S (Ez[i,j+1] - Ez[i,j])          Hy += S (Ez[i+1,j] - Ez[i,j])
//   Ampere    eps dE/dt = curl H - sigma E - J
//                                      Ez = ca Ez + cb ((Hy[i,j] - Hy[i-1,j]) - (Hx[i,j] - Hx[i,j-1])) + src
//
// in units where Delta x = Delta y = 1, c = 1, mu = 1, so Delta t IS the Courant number S = c dt / dx. The state of a
// cell is one texel: R = Ez, G = Hx, B = Hy, A spare. A fragment shader cannot read the texture it writes, so each
// pass reads one target and writes the other and the two swap; after the two passes of a substep the state is back in
// the target it started in, which is what keeps the caller's bookkeeping simple.
//
// Why the divergence of B stays zero EXACTLY (so the H field lines of render.js are closed, no monopoles): the
// discrete divergence at the cell corner (i+1/2, j+1/2) is d = (Hx[i+1,j] - Hx[i,j]) + (Hy[i,j+1] - Hy[i,j]), and
// substituting the two Faraday updates cancels the four Ez terms term by term. tools/test_fdtd.js is that algebra
// checked numerically on a 64x64 twin of these kernels, together with the energy and the wave-speed gates.
//
// Sources are SOFT (added to Ez / to H, never assigned), so a wave passes through a charge instead of scattering off
// it. Every number below is a named constant: the user retunes here, never inside a shader string.

export const COURANT = 0.5;      // c dt / dx — decided (MAXWELL-SESSION-PROMPT "Numerics"), `light` scales it 0.3..1
// grid and substeps per frame by ctx.tier(): [w, h, substeps]. 16:9 throughout; the simulation runs by FRAME COUNT,
// never dt-scaled, so a CLOCK=1 frame is reproducible (the plan's decision).
// v0.11 item 2 takes the cost lever the v0.10 worker left (DECISIONS §42 item 6): tier 3's substeps go 4 -> 3, the
// one numerics change of this session, which pays for the colour field. The only visible consequence is that light
// travels a quarter slower at the top tier.
export const GRIDT = [[256, 144, 2], [384, 216, 3], [512, 288, 4], [768, 432, 3]];
export const ABSN = 16;          // cells of graded absorber at the edge (quadratic ramp), not a full PML
export const ABSSIG = 0.75;      // sigma at the outermost absorber cell
export const SRCW = 2.3;         // gaussian half-width in cells of a charge's source blob
export const KW = 3.4;           // ... of the central current loop (the kick)
export const DIPW = 3.6;         // ... of each of the dipole's two currents
export const DIPD = 7.0;         // ... and their half-separation in cells (the current loop's radius)
export const CUT = 4.0;          // a blob is evaluated only within CUT widths (12 charges per texel otherwise)
export const PULSE_A = 1.0;      // hooks.lab's one pinned pulse: amplitude
export const PULSE_W = 3.0;      // ... and width in cells. 3 cells keeps the spectrum well below the Nyquist cell,
                                 // which is what makes the leapfrog's energy gate readable (a delta would not be).

// ---------------------------------------------------------------------------------------------------------------
// The GLSL. Both passes are fullscreen (ctx.mkProg + ctx.tri) over the field target, so gl_FragCoord.xy is the cell.
// ---------------------------------------------------------------------------------------------------------------

const BLOB = `
float blob(vec2 p, vec2 c, float w) {
  vec2 d = p - c;
  float q = dot(d, d);
  if (q > ${(CUT * CUT).toFixed(1)} * w * w) return 0.0;
  return exp(-q / (2.0 * w * w));
}
`;

// Faraday. Reads Ez and H of the previous half step, writes the new H; Ez rides through untouched.
//
// There is NO source term here, and that is a decision, not an omission: any magnetic current M added to this pass
// carries a magnetic charge density -div M unless M is itself divergence-free, and the first build drove the central
// dipole that way. H then stopped being divergence-free at the dipole, its stream function stopped being
// path-independent, and the field lines came out as a bundle of parallel lines running from the centre to the edge
// of the frame along the axis of the integration sweep. With Faraday sourceless and H starting at zero, div H is
// zero exactly and for ever (test_fdtd gate 1), which is what the closed field lines of render.js rest on. The
// dipole is driven where a real one is driven: as a current, in the Ampere pass below.
export const FS_H = `
uniform sampler2D uF;
uniform vec2 uSz;
uniform float uS;
void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  ivec2 hi = ivec2(uSz) - 1;
  vec4 f = texelFetch(uF, p, 0);
  float ez = f.r;
  float ex = texelFetch(uF, ivec2(min(p.x + 1, hi.x), p.y), 0).r;
  float ey = texelFetch(uF, ivec2(p.x, min(p.y + 1, hi.y)), 0).r;
  float hx = f.g - uS * (ey - ez);
  float hy = f.b + uS * (ex - ez);
  o = vec4(ez, hx, hy, f.a);
}
`;

// Ampere-Maxwell. Reads the new H and the old Ez, writes the new Ez; H rides through untouched. The displacement
// current is the eps dE/dt term on the left: without it nothing would propagate at all.
export const FS_E = `
uniform sampler2D uF;
uniform sampler2D uM;   // the medium: R eps, G sigma, B conductor mask, A spare (medium.js)
uniform vec2 uSz;
uniform float uS;
uniform float uLab;     // 1 = hooks.lab: vacuum, no absorber, no music sources, a perfect-conductor wall
uniform float uPulse;   // 1 on the one substep the lab pulse is injected
uniform vec2 uCtr;
uniform float uJ;       // the central z-current this substep (the bass: a kick is a current loop)
uniform vec4 uDip;      // the dipole: its current this substep, its axis (unit), and the half-separation in cells
uniform float uCX[12];
uniform float uCY[12];
uniform float uCA[12];
uniform vec2 uRing;     // the charges' ring: its radius in cells and how far its blobs reach
${BLOB}
void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  ivec2 hi = ivec2(uSz) - 1;
  vec4 f = texelFetch(uF, p, 0);
  vec4 md = texelFetch(uM, p, 0);
  float hy0 = texelFetch(uF, ivec2(max(p.x - 1, 0), p.y), 0).b;
  float hx0 = texelFetch(uF, ivec2(p.x, max(p.y - 1, 0)), 0).g;
  float curl = (f.b - hy0) - (f.g - hx0);
  float eps = mix(md.r, 1.0, uLab);
  float sig = md.g * (1.0 - uLab);
  float mir = md.b * (1.0 - uLab);
  float a = sig * uS / (2.0 * eps);
  float ca = (1.0 - a) / (1.0 + a);
  float cb = (uS / eps) / (1.0 + a);
  float src = 0.0;
  // The twelve charges sit on ONE ring, so a single radius test skips the twelve-blob loop for the ~85 % of texels
  // that are nowhere near it. (Twelve distance tests per texel per substep is 16 M of them a frame at tier 3.)
  float rr = length(gl_FragCoord.xy - uCtr);
  if (abs(rr - uRing.x) < uRing.y) {
    for (int k = 0; k < 12; k++) {
      if (abs(uCA[k]) > 1e-6) src += uCA[k] * blob(gl_FragCoord.xy, vec2(uCX[k], uCY[k]), ${SRCW.toFixed(2)});
    }
  }
  if (abs(uJ) > 1e-6) src += uJ * blob(gl_FragCoord.xy, uCtr, ${KW.toFixed(2)});
  // The magnetic dipole, as what a magnetic dipole IS: a current loop. In two dimensions that is a pair of
  // antiparallel z-currents, and the pair's axis is the dipole's. Turning the axis turns the two-lobed radiation
  // pattern; a pure z-current cannot create magnetic charge, so div H stays zero (see FS_H).
  if (abs(uDip.x) > 1e-6) {
    vec2 d = uDip.yz * uDip.w;
    src += uDip.x * (blob(gl_FragCoord.xy, uCtr + d, ${DIPW.toFixed(2)}) - blob(gl_FragCoord.xy, uCtr - d, ${DIPW.toFixed(2)}));
  }
  if (uPulse > 0.5) src += ${PULSE_A.toFixed(2)} * blob(gl_FragCoord.xy, uCtr, ${PULSE_W.toFixed(2)});
  float ez = ca * f.r + cb * curl + src;
  ez *= 1.0 - mir;      // the conductor: a graded mask, so a medium cross-fade never cuts (cuts: 'continuous')
  if (p.x == 0 || p.y == 0 || p.x == hi.x || p.y == hi.y) ez = 0.0;   // the outer wall is a perfect conductor
  o = vec4(ez, f.g, f.b, f.a);
}
`;

// ---------------------------------------------------------------------------------------------------------------
// Targets and readback
// ---------------------------------------------------------------------------------------------------------------

// A field target: ctx.mkTarget's RGBA16F, re-specified as RGBA32F when the GPU will render it (EXT_color_buffer_float),
// and NEAREST both ways — texelFetch ignores the filter but render.js's texture() reads do not, and a LINEAR field
// blurs the staggering into mush. `float32` says which it got; the report prints it.
export function mkField(ctx, w, h) {
  const gl = ctx.gl;
  const t = ctx.mkTarget(w, h, false, false);
  let f32 = false;
  if (gl.getExtension('EXT_color_buffer_float')) {
    gl.bindTexture(gl.TEXTURE_2D, t.t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, w, h, 0, gl.RGBA, gl.FLOAT, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, t.f);
    f32 = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    if (!f32) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
  gl.bindTexture(gl.TEXTURE_2D, t.t);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.bindTexture(gl.TEXTURE_2D, null);
  t.float32 = f32;
  return t;
}

// IEEE half -> double, for the GPUs whose IMPLEMENTATION_COLOR_READ_TYPE is HALF_FLOAT.
export function h2f(h) {
  const s = h & 0x8000 ? -1 : 1, e = (h >> 10) & 0x1f, m = h & 0x3ff;
  if (e === 0) return s * m * 5.9604644775390625e-8;
  if (e === 31) return m ? NaN : s * Infinity;
  return s * Math.pow(2, e - 15) * (1 + m / 1024);
}

// Read `rows` rows of `t` starting at row y into a Float32Array of 4*w*rows. A readback stalls the pipeline: the
// per-frame caller asks for one band, the test hooks for the whole thing (they are allowed to be slow).
export function readBand(ctx, t, y, rows, out) {
  const gl = ctx.gl;
  gl.bindFramebuffer(gl.FRAMEBUFFER, t.f);
  const type = gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_TYPE);
  const n = 4 * t.w * rows;
  const dst = out && out.length >= n ? out : new Float32Array(n);
  if (type === gl.FLOAT) {
    gl.readPixels(0, y, t.w, rows, gl.RGBA, gl.FLOAT, dst.subarray(0, n));
  } else {
    const u = new Uint16Array(n);
    gl.readPixels(0, y, t.w, rows, gl.RGBA, gl.HALF_FLOAT, u);
    for (let i = 0; i < n; i++) dst[i] = h2f(u[i]);
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return dst;
}

export function readType(ctx, t) {
  const gl = ctx.gl;
  gl.bindFramebuffer(gl.FRAMEBUFFER, t.f);
  const type = gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_TYPE);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return type === gl.FLOAT ? 'FLOAT' : type === gl.HALF_FLOAT ? 'HALF_FLOAT' : String(type);
}

// Sum(eps Ez^2 + Hx^2 + Hy^2) over the whole field, from a readback. `medEps(i)` gives eps per texel (lab mode: 1).
export function energyOf(px, w, h, medEps) {
  let s = 0;
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const o = 4 * (j * w + i);
      const e = px[o], hx = px[o + 1], hy = px[o + 2];
      s += (medEps ? medEps(i, j) : 1) * e * e + hx * hx + hy * hy;
    }
  }
  return s;
}

// The graded absorber's sigma at cell (i, j) of a w x h grid — the same profile medium.js emits, kept here because
// the twin in tools/test_fdtd.js needs it without a GL context.
export function absSigma(i, j, w, h) {
  const d = Math.min(i, j, w - 1 - i, h - 1 - j);
  if (d >= ABSN) return 0;
  const u = (ABSN - d) / ABSN;
  return ABSSIG * u * u;
}
