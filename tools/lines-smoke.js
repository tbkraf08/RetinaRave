// Smoke test for the core line renderer (ctx.lines, docs/CONTRACTS.md §1.12). Draws into a 64×64 RGBA8 depth target
// through CARD.ctx and reads pixels back: depth ordering (near red over far blue in either draw order), no depth when
// off, capsule coverage/width, and a path-B program built from the GLSL chunks. usage: [GPU=1] node tools/lines-smoke.js
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SNIPPET = `(() => {
  const c = CARD.ctx, gl = c.gl, R = {}, px = new Uint8Array(4);
  const rd = (T, x, y) => { gl.bindFramebuffer(gl.FRAMEBUFFER, T.f); gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); return [px[0], px[1], px[2]]; };
  const fresh = () => c.mkTarget(64, 64, true, true);
  // red horizontal at z=0 (near), blue vertical at z=0.5 (far); identity mvp so clip = position
  const red = [-0.8, 0, 0, 6, 0.8, 0, 0, 6, 1, 0, 0, 1], blue = [0, -0.8, 0.5, 6, 0, 0.8, 0.5, 6, 0, 0, 1, 1];
  const L = c.lines.mk(4);
  let T = fresh();
  c.lines.set(L, new Float32Array([...red, ...blue]), 2); c.lines.draw(L, T, 64, 64, { depth: true });
  R.depthRedFirst = rd(T, 32, 32);
  T = fresh();
  c.lines.set(L, new Float32Array([...blue, ...red]), 2); c.lines.draw(L, T, 64, 64, { depth: true });
  R.depthBlueFirst = rd(T, 32, 32);
  R.blueArm = rd(T, 32, 50);
  R.off = rd(T, 10, 10);
  R.redEdgeIn = rd(T, 20, 34);   // 2 px from the axis, inside hw 3
  R.redEdgeOut = rd(T, 20, 37);  // 5 px out: beyond hw 3 + 1 px feather
  T = fresh();
  c.lines.set(L, new Float32Array([...red, ...blue]), 2); c.lines.draw(L, T, 64, 64, { depth: false });
  R.noDepthRedFirst = rd(T, 32, 32);
  // path B: three horizontal strokes generated from gl_InstanceID, no buffer
  const VS = '#version 300 es\\nprecision highp float;precision highp int;\\n' + c.lines.VS +
    'void main(){float i=float(gl_InstanceID);vec4 c0=vec4(-.8,-.6+.4*i,0.,1.),c1=vec4(.8,-.6+.4*i,0.,1.);gl_Position=lineCorner(c0,c1,4.,4.);}';
  const FS = '#version 300 es\\nprecision highp float;\\n' + c.lines.FS + 'out vec4 o;void main(){float m=lineMask();o=vec4(m,m*.5,0.,m);}';
  const pr = c.mkProg(VS, FS, 'lines-smoke-b');
  T = fresh();
  c.use(pr, T, 64, 64);
  c.lines.drawN(3, { depth: true });
  R.pathB_on = rd(T, 32, 26);   // ndc y = -0.2 → row 25.6
  R.pathB_off = rd(T, 32, 32);
  R.errs = CARD.ERRS.slice();
  R.glerr = gl.getError();
  return JSON.stringify(R);
})()`;

const r = spawnSync('node', [path.join(HERE, 'cdp.js'), 'test&scene=0', JSON.stringify([{ until: 'window.CARD && CARD.frameN > 5' }, { eval: SNIPPET }])], { encoding: 'utf8', env: process.env });
const line = (r.stdout || '').split('\n').find((l) => l.includes('depthRedFirst'));
if (!line) {
  console.log(r.stdout, r.stderr);
  console.log('FAIL lines-smoke: no result');
  process.exit(1);
}
const R = JSON.parse(JSON.parse(line.slice(line.indexOf('=>') + 2).trim()));
const isRed = (p) => p[0] > 200 && p[1] < 40 && p[2] < 40, isBlue = (p) => p[2] > 200 && p[0] < 40, isBlack = (p) => p[0] + p[1] + p[2] < 12;
const checks = {
  'near red wins, red drawn first': isRed(R.depthRedFirst),
  'near red wins, blue drawn first': isRed(R.depthBlueFirst),
  'blue arm present': isBlue(R.blueArm),
  'off-line pixel black': isBlack(R.off),
  'inside half width': isRed(R.redEdgeIn),
  'outside width + feather': isBlack(R.redEdgeOut),
  'depth off: last drawn (blue) on top': isBlue(R.noDepthRedFirst),
  'path B stroke present (orange)': R.pathB_on[0] > 200 && R.pathB_on[1] > 80 && R.pathB_on[1] < 160 && R.pathB_on[2] < 20,
  'path B gap black': isBlack(R.pathB_off),
  'no shader errors': R.errs.length === 0,
  'no GL error': R.glerr === 0,
};
let fails = 0;
for (const [k, ok] of Object.entries(checks)) {
  if (!ok) fails++;
  console.log((ok ? 'ok   ' : 'FAIL ') + k);
}
console.log(JSON.stringify(R));
console.log(fails ? `lines-smoke: ${fails} FAIL` : 'lines-smoke: OK');
process.exit(fails ? 1 : 0);
