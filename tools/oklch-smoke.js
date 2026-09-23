// GPU smoke test for the OKLCH chunk (assets/core/oklch.js, CONTRACTS §1.14): builds a program from the chunk through
// CARD.ctx, renders a 360-hue sweep into an RGBA8 target and reads it back against the JS twin (assets/math/oklab.js).
// Checks: GPU = JS to 2/255 at L .7 C .11; 0 clipped hues there; a heavy-chroma row still matches the twin's clip;
// an OKLab interpolation between complementary hues keeps L (the gamma midpoint does not); the chunk compiles clean.
// usage: [GPU=1] node tools/oklch-smoke.js   (passes on SwiftShader too)
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SNIPPET = `(async () => {
  const c = CARD.ctx, gl = c.gl, W = 360, H = 4;
  const { OKLCH_GLSL } = await import('/assets/core/oklch.js');
  const { palOK, linToSrgb, linToOkLab, srgbToLin } = await import('/assets/math/oklab.js');
  const FS = OKLCH_GLSL + 'void main(){float h=(gl_FragCoord.x-.5)/360.;/* pixel i → hue i/360 */int row=int(gl_FragCoord.y);vec3 c;'
    + 'if(row==0)c=palOKs(h,.7,.11);else if(row==1)c=vec3(okClip(h,.7,.11));else if(row==2)c=palOKs(h,.5,.3);'
    + 'else{vec3 A=vec3(.7,.11*cos(TAU*.05),.11*sin(TAU*.05)),B=vec3(.7,.11*cos(TAU*.55),.11*sin(TAU*.55));c=linToSrgb(clamp(okLabToLin(mix(A,B,h)),0.,1.));}'
    + 'o=vec4(c,1.);}';
  const pr = c.mkProg(FS, 'oklch-smoke');
  const T = c.mkTarget(W, H, true);
  c.use(pr, T, W, H); c.tri();
  gl.bindFramebuffer(gl.FRAMEBUFFER, T.f);
  const px = new Uint8Array(W * H * 4); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px);
  const row = (r) => Array.from({ length: W }, (_, i) => [px[(r * W + i) * 4], px[(r * W + i) * 4 + 1], px[(r * W + i) * 4 + 2]]);
  const r0 = row(0), r1 = row(1), r2 = row(2), r3 = row(3);
  const err = (r, L, C) => { let m = 0; for (let i = 0; i < W; i++) { const j = linToSrgb(palOK(i / 360, L, C)).map((x) => Math.round(x * 255)); for (let k = 0; k < 3; k++) m = Math.max(m, Math.abs(j[k] - r[i][k])); } return m; };
  const Lof = (p) => linToOkLab(srgbToLin(p.map((x) => x / 255)))[0];
  const A = r3[0], B = r3[W - 1], mid = r3[180], gmid = A.map((x, k) => Math.round((x + B[k]) / 2));
  const distinct = new Set(r0.map((p) => p.join(','))).size;
  return JSON.stringify({ maxErr: err(r0, 0.7, 0.11), clipped: r1.filter((p) => p[0] < 255).length, maxErrClip: err(r2, 0.5, 0.3),
    clippedHeavy: r2.length, distinct, Lmid: +Lof(mid).toFixed(4), LgammaMid: +Lof(gmid).toFixed(4), LA: +Lof(A).toFixed(4), LB: +Lof(B).toFixed(4),
    errs: CARD.ERRS.slice(), glerr: gl.getError() });
})()`;

const r = spawnSync('node', [path.join(HERE, 'cdp.js'), 'test&scene=0', JSON.stringify([{ until: 'window.CARD && CARD.frameN > 5' }, { eval: SNIPPET }])], { encoding: 'utf8', env: process.env });
const line = (r.stdout || '').split('\n').find((l) => l.includes('maxErrClip'));
if (!line) { console.log(r.stdout, r.stderr); console.log('FAIL oklch-smoke: no result'); process.exit(1); }
const R = JSON.parse(JSON.parse(line.slice(line.indexOf('=>') + 2).trim()));
const checks = {
  'GPU = JS twin at L .7 C .11 (≤ 2/255)': R.maxErr <= 2,
  '0 clipped hues at L .7 C .11': R.clipped === 0,
  'heavy chroma (L .5 C .3) clips like the twin (≤ 3/255)': R.maxErrClip <= 3,
  'OKLab midpoint of complementary hues keeps L (±.01)': Math.abs(R.Lmid - 0.7) <= 0.01,
  'gamma midpoint is darker (the reason to interpolate in OKLab)': R.LgammaMid < R.Lmid - 0.005,
  'hue sweep has ≥ 300 distinct 8-bit colours over 360 hues': R.distinct >= 300,
  'no shader errors, GL clean': R.errs.length === 0 && R.glerr === 0,
};
let fails = 0;
for (const [k, ok] of Object.entries(checks)) { console.log((ok ? 'ok   ' : 'FAIL ') + k); if (!ok) fails++; }
console.log(JSON.stringify(R));
console.log(fails ? `oklch-smoke: ${fails} FAIL` : 'oklch-smoke: OK');
process.exit(fails ? 1 : 0);
