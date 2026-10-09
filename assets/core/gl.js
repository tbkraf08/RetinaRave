// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// GL: context, program builder, shared GLSL head, render targets, resize, tri(), tex(). Knows nothing about scenes.
// Lifted from cardioid3 "GL". Scenes never import this module: they receive a ctx (see docs/CONTRACTS.md).
import { LOOK } from './look.js';

export const ERRS = [];
export const G = { gl: null, cv: null, FLOAT: false, PW: 0, PH: 0, RT: {} };

export const VS = `#version 300 es
out vec2 vUv;void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);vUv=p;gl_Position=vec4(p*2.-1.,0.,1.);}`;

// Every fragment program built with mkProg starts with HEAD. Uniforms uRes uTime uBands uBeat uArc uHarm uPal uTint
// are bound by use() from LOOK; pal()/cmul()/rot()/hash() are the shared helpers.
export const HEAD = `#version 300 es
precision highp float;precision highp int;
in vec2 vUv;out vec4 o;
uniform vec2 uRes;uniform float uTime;uniform vec3 uBands;uniform vec4 uBeat;uniform vec4 uArc;uniform vec4 uHarm;uniform vec4 uPal;uniform vec3 uTint;
#define TAU 6.2831853
vec3 pal(float t){vec3 c=.5+.5*cos(TAU*(t+uPal.x+uPal.y*vec3(0.,.33,.67)));c=mix(c,c*uTint*1.5,.55);c*=c*1.3;float l=dot(c,vec3(.299,.587,.114));return mix(vec3(l),c,uPal.z)*uPal.w;}
vec2 cmul(vec2 a,vec2 b){return vec2(a.x*b.x-a.y*b.y,a.x*b.y+a.y*b.x);}
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,s,-s,c);}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
`;
export const COMMON_UNIFORMS = ['uRes', 'uTime', 'uBands', 'uBeat', 'uArc', 'uHarm', 'uPal', 'uTint'];

let vaoTri = null;

export function initGL(canvas) {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' });
  if (!gl) throw new Error('no webgl2');
  G.gl = gl;
  G.cv = canvas;
  G.FLOAT = !!gl.getExtension('EXT_color_buffer_float');
  gl.getExtension('OES_texture_float_linear');
  vaoTri = gl.createVertexArray();
  return gl;
}

// Build a program. mkProg(fs, name) prepends HEAD and uses the fullscreen VS; mkProg(vs, fs, name) is raw.
export function mkProg(a, b, c) {
  const gl = G.gl;
  const raw = c !== undefined;
  const vs = raw ? a : VS, fs = raw ? b : HEAD + a, name = raw ? c : b;
  const p = gl.createProgram();
  for (const [t, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
    const s = gl.createShader(t);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      const e = 'shader ' + name + ': ' + gl.getShaderInfoLog(s);
      console.error(e);
      ERRS.push(e);
    }
    gl.attachShader(p, s);
  }
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    const e = 'link ' + name + ': ' + gl.getProgramInfoLog(p);
    console.error(e);
    ERRS.push(e);
  }
  const loc = {};
  return { p, name, u: (n) => (n in loc ? loc[n] : (loc[n] = gl.getUniformLocation(p, n))) };
}

// Bind program + target + viewport and upload the common uniforms from LOOK.
export function use(pr, tgt, w, h) {
  const gl = G.gl;
  gl.useProgram(pr.p);
  gl.bindFramebuffer(gl.FRAMEBUFFER, tgt ? tgt.f : null);
  gl.viewport(0, 0, w, h);
  const u = pr.u;
  if (u('uRes')) gl.uniform2f(u('uRes'), w, h);
  if (u('uTime')) gl.uniform1f(u('uTime'), LOOK.time);
  if (u('uBands')) gl.uniform3fv(u('uBands'), LOOK.bands);
  if (u('uBeat')) gl.uniform4fv(u('uBeat'), LOOK.beat);
  if (u('uArc')) gl.uniform4fv(u('uArc'), LOOK.arc);
  if (u('uHarm')) gl.uniform4fv(u('uHarm'), LOOK.harm);
  if (u('uPal')) gl.uniform4fv(u('uPal'), LOOK.pal);
  if (u('uTint')) gl.uniform3fv(u('uTint'), LOOK.tint);
}

export function tex(pr, name, unit, t) {
  const gl = G.gl;
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, t.t);
  gl.uniform1i(pr.u(name), unit);
}

export function tri() {
  const gl = G.gl;
  gl.bindVertexArray(vaoTri);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

// Dynamic vertex buffer with one float attribute (location 0, comps floats per vertex).
export function dynBuf(size, comps) {
  const gl = G.gl;
  const vao = gl.createVertexArray(), buf = gl.createBuffer();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, size * 4, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, comps, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
  return { vao, buf };
}

export function upload(b, data, n) {
  const gl = G.gl;
  gl.bindBuffer(gl.ARRAY_BUFFER, b.buf);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, data, 0, n);
}

// Render target. rgba8=true forces an 8-bit target (needed for CPU readback: readPixels from RGBA16F returns black).
// depth=true attaches a DEPTH_COMPONENT24 renderbuffer (the core's scene targets a/b have one; ctx.lines depth-tests
// against it). Created cleared: colour opaque black, depth 1.
export function mkTarget(w, h, rgba8 = false, depth = false) {
  const gl = G.gl, F = G.FLOAT && !rgba8;
  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, F ? gl.RGBA16F : gl.RGBA8, w, h, 0, gl.RGBA, F ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE, null);
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) {
    gl.texParameteri(gl.TEXTURE_2D, k, v);
  }
  const f = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, f);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
  let d = null;
  if (depth) {
    d = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, d);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, w, h);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, d);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  }
  gl.clearColor(0, 0, 0, 1);
  gl.depthMask(true);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  return { t, f, w, h, d };
}

export function freeTarget(t) {
  if (t) {
    G.gl.deleteTexture(t.t);
    G.gl.deleteFramebuffer(t.f);
    if (t.d) G.gl.deleteRenderbuffer(t.d);
  }
}

// Engine textures (R8): spec 256×1, wave 512×1, hist 256×128 ring. Uploaded when the engine reports a new hop: spec and
// wave whole, hist only the rows written since the last upload (one per hop — v0.2 §13; `full` = the v0.1 whole-texture
// path, kept for the harness's `&histfull=1` proof). `bytes` counts what went over the bus (harness readout).
// vel / dye (DECISIONS §104): the fluid substrate's velocity (RG16F, uv/s, simW×simH) and dye (RGBA16F linear, dyeW×dyeH),
// GPU-written by core/fluid/fluid.js — never uploaded here, not in `bytes`; 1×1 black placeholders while the fluid is off.
export const ETEX = { spec: null, wave: null, hist: null, row: 0, hop: -1, full: false, bytes: 0, vel: null, dye: null, simW: 0, simH: 0, dyeW: 0, dyeH: 0 };
function r8(w, h) {
  const gl = G.gl, t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, w, h, 0, gl.RED, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, h > 1 ? gl.REPEAT : gl.CLAMP_TO_EDGE);
  return { t, w, h };
}
export function uploadEngineTex(T) {
  const gl = G.gl;
  if (!ETEX.spec) {
    ETEX.spec = r8(256, 1);
    ETEX.wave = r8(512, 1);
    ETEX.hist = r8(256, 128);
  }
  if (T.hop === ETEX.hop) return;
  const delta = ETEX.hop < 0 ? 128 : T.hop - ETEX.hop; // hops since the last upload = rows the engine wrote since then
  ETEX.hop = T.hop;
  ETEX.row = T.row;
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.bindTexture(gl.TEXTURE_2D, ETEX.spec.t);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 256, 1, gl.RED, gl.UNSIGNED_BYTE, T.spec);
  gl.bindTexture(gl.TEXTURE_2D, ETEX.wave.t);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 512, 1, gl.RED, gl.UNSIGNED_BYTE, T.wave);
  gl.bindTexture(gl.TEXTURE_2D, ETEX.hist.t);
  ETEX.bytes += 256 + 512;
  const H = ETEX.hist.h, W = ETEX.hist.w;
  const rows = (y0, n) => {
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, y0, W, n, gl.RED, gl.UNSIGNED_BYTE, T.hist.subarray(y0 * W, (y0 + n) * W));
    ETEX.bytes += n * W;
  };
  if (ETEX.full || delta >= H || delta <= 0) rows(0, H); // first upload, a hidden tab, or the harness switch
  else {
    // the newest row is T.row - 1; the rows to send are the last `delta` ending there, wrapping at the ring's top
    const start = T.row - delta;
    if (start >= 0) rows(start, delta);
    else { rows(H + start, -start); if (T.row > 0) rows(0, T.row); }
  }
}

const onResize = [];
export const addResizeHook = (fn) => onResize.push(fn);

// Full-size targets a, b (scene passes, with depth), m (crossfade). Effects allocate their own via the resize hook.
const LONG_EDGE = typeof matchMedia === 'function' && matchMedia('(pointer:coarse)').matches ? 1600 : 2560; // v0.6: phones render smaller (DPR 3 screens)
export function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  let w = Math.round(innerWidth * dpr), h = Math.round(innerHeight * dpr);
  const cap = LONG_EDGE / Math.max(w, h);
  if (cap < 1) {
    w = Math.round(w * cap);
    h = Math.round(h * cap);
  }
  w = Math.max(w, 16);
  h = Math.max(h, 16);
  if (w === G.PW && h === G.PH) return;
  G.PW = G.cv.width = w;
  G.PH = G.cv.height = h;
  const RT = G.RT;
  for (const k in RT) freeTarget(RT[k]);
  RT.a = mkTarget(w, h, false, true);
  RT.b = mkTarget(w, h, false, true);
  RT.m = mkTarget(w, h);
  for (const f of onResize) f(w, h);
}
