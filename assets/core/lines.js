// LINES: anti-aliased, depth-testable strokes drawn as instanced quads, one instance per segment (docs/CONTRACTS.md §1.12).
// Two paths share the same GLSL:
//  A. CPU segments — L = mk(maxSegs); set(L, Float32Array, n); draw(L, target, w, h, {mvp, depth, blend}). Built-in program:
//     12 floats per segment [x0 y0 z0 w0px  x1 y1 z1 w1px  r g b a], projected by mvp.
//  B. GPU polylines — a raw vertex shader includes VS_CHUNK, computes the two clip-space endpoints of segment
//     gl_InstanceID itself and returns lineCorner(c0, c1, w0px, w1px); its fragment shader includes FS_CHUNK and
//     multiplies its colour by lineMask(); drawN(n, opts) issues the instanced draw. No buffer at all.
// Knows nothing about scenes.
import { G, mkProg, use } from './gl.js';

export const VS_CHUNK = `
uniform vec2 uRes;
flat out vec4 vLineSeg;
flat out vec2 vLineHW;
// The corner gl_VertexID (0..3, TRIANGLE_STRIP) of the quad around the segment c0→c1 (clip space); w0/w1 = stroke width
// in pixels at each end. The quad is extended by a half width + 1 px at both ends so caps and joins are covered; the
// fragment side cuts a capsule out of it (lineMask). A segment with an endpoint behind the camera is dropped.
vec4 lineCorner(vec4 c0, vec4 c1, float w0, float w1) {
  if (!(c0.w > 1e-5 && c1.w > 1e-5)) { vLineSeg = vec4(0.); vLineHW = vec2(0.); return vec4(2., 2., 2., 1.); }
  vec2 s0 = (c0.xy / c0.w * .5 + .5) * uRes, s1 = (c1.xy / c1.w * .5 + .5) * uRes;
  vec2 d = s1 - s0;
  float len = length(d);
  d = len > 1e-4 ? d / len : vec2(1., 0.);
  vec2 n = vec2(-d.y, d.x);
  int k = gl_VertexID;
  float e = float(k >> 1), side = float((k & 1) * 2 - 1);
  vLineSeg = vec4(s0, s1);
  vLineHW = vec2(max(w0, 0.) * .5, max(w1, 0.) * .5);
  float hw = mix(vLineHW.x, vLineHW.y, e) + 1.;
  vec2 s = mix(s0, s1, e) + n * side * hw + d * (e * 2. - 1.) * hw;
  vec4 c = mix(c0, c1, e);
  return vec4((s / uRes * 2. - 1.) * c.w, c.z, c.w);
}
`;

export const FS_CHUNK = `
flat in vec4 vLineSeg;
flat in vec2 vLineHW;
// Coverage 0..1 of this fragment by the capsule around the segment, anti-aliased over 1 px. Widths under 1 px dim the
// stroke instead of thinning it, so a hairline keeps its energy at any zoom.
float lineMask() {
  vec2 a = vLineSeg.xy, b = vLineSeg.zw, p = gl_FragCoord.xy, ab = b - a;
  float t = clamp(dot(p - a, ab) / max(dot(ab, ab), 1e-6), 0., 1.);
  float hw = mix(vLineHW.x, vLineHW.y, t);
  float d = distance(p, a + ab * t);
  return clamp(hw - d + .5, 0., 1.) * min(1., 2. * hw);
}
`;

const VS_A = '#version 300 es\nprecision highp float;precision highp int;\n' + VS_CHUNK + `
layout(location=0) in vec4 aA;
layout(location=1) in vec4 aB;
layout(location=2) in vec4 aC;
uniform mat4 uMVP;
flat out vec4 vLineCol;
void main(){vec4 c0=uMVP*vec4(aA.xyz,1.),c1=uMVP*vec4(aB.xyz,1.);vLineCol=aC;gl_Position=lineCorner(c0,c1,aA.w,aB.w);}`;
const FS_A = '#version 300 es\nprecision highp float;\n' + FS_CHUNK + `
flat in vec4 vLineCol;out vec4 o;
void main(){float m=lineMask()*vLineCol.a;o=vec4(vLineCol.rgb*m,m);}`;

const IDENT = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
const STRIDE = 48; // 12 floats per segment
let prA = null, vaoEmpty = null;

export function initLines() {
  prA = mkProg(VS_A, FS_A, 'lines');
  vaoEmpty = G.gl.createVertexArray();
}

// A segment buffer for up to cap segments (per-instance attributes 0..2 = aA, aB, aC).
export function mk(cap) {
  const gl = G.gl, vao = gl.createVertexArray(), buf = gl.createBuffer();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, cap * STRIDE, gl.DYNAMIC_DRAW);
  for (let i = 0; i < 3; i++) {
    gl.enableVertexAttribArray(i);
    gl.vertexAttribPointer(i, 4, gl.FLOAT, false, STRIDE, i * 16);
    gl.vertexAttribDivisor(i, 1);
  }
  gl.bindVertexArray(null);
  return { vao, buf, cap, n: 0 };
}

// Upload the first n segments of data (12 floats each).
export function set(L, data, n) {
  const gl = G.gl;
  L.n = Math.min(n, L.cap);
  gl.bindBuffer(gl.ARRAY_BUFFER, L.buf);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, data, 0, L.n * 12);
}

// opts: depth true (test + write, LEQUAL) | 'test' (test only) | false · blend 'over' (default, premultiplied) | 'add'
function enter(o) {
  const gl = G.gl;
  if (o.depth) {
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.depthMask(o.depth !== 'test');
  }
  gl.enable(gl.BLEND);
  if (o.blend === 'add') gl.blendFunc(gl.ONE, gl.ONE);
  else gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
}
function leave() {
  const gl = G.gl;
  gl.disable(gl.BLEND);
  gl.disable(gl.DEPTH_TEST);
  gl.depthMask(true);
}

// Path A: draw a segment buffer into target at (w, h) with the built-in program.
export function draw(L, target, w, h, o = {}) {
  const gl = G.gl;
  if (!(L.n > 0)) return;
  use(prA, target, w, h);
  gl.uniformMatrix4fv(prA.u('uMVP'), false, o.mvp || IDENT);
  enter(o);
  gl.bindVertexArray(L.vao);
  gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, L.n);
  gl.bindVertexArray(null);
  leave();
}

// Path B: the caller has bound its own program (ctx.use) and set its uniforms; draw n segments from gl_InstanceID.
export function drawN(n, o = {}) {
  const gl = G.gl;
  if (!(n > 0)) return;
  enter(o);
  gl.bindVertexArray(vaoEmpty);
  gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, n);
  gl.bindVertexArray(null);
  leave();
}
