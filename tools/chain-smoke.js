// Smoke test for the effect chain's colour space (v0.3 §20, CONTRACTS §1.10). Drives the real effects through
// CARD.ctx / CARD.EFFECTS with synthetic inputs, once with io.linear 0 and once with 1, and reads back:
//   fringe  — a hard magenta | green edge of EQUAL luminance (Y 0.285 both sides) through bloom's blur (threshold
//             open): min luminance across the edge relative to the endpoints. A linear blend of equal-luminance colours
//             keeps Y (≈ 1); the encoded blend dips to ≈ 0.45 — the dark fringe between complementary hues.
//   white   — a full-white frame through the composite (no bloom, no flash, kaleido 0): the screen pixel at the
//             centre. Encoded tonemap 1 − exp(−1.5): 198/255; linear, normalised: 255.
//   k       — the tonemap's shape at the knee: the composite's uTm.y (CHAIN.k) applied to 0.18 grey, reported.
// usage: [GPU=1] node tools/chain-smoke.js   (passes on SwiftShader too)
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SNIPPET = `(() => {
  const c = CARD.ctx, gl = c.gl, W = 256, H = 64;
  const bloom = CARD.EFFECTS.find((e) => e.name === 'bloom'), comp = CARD.EFFECTS.find((e) => e.name === 'composite');
  const paint = c.mkProg('uniform vec3 uL,uR;void main(){o=vec4(vUv.x<.5?uL:uR,1.);}', 'chain-paint');
  const copy = c.mkProg(c.oklch + 'uniform sampler2D uT;uniform float uEnc;void main(){vec3 v=texture(uT,vUv).rgb;o=vec4(mix(v,linToSrgb(v),uEnc),1.);}', 'chain-copy');
  const src = c.mkTarget(W, H), rd8 = c.mkTarget(64, 16, true), blk = c.mkTarget(4, 4);
  const Y = (p) => { const d = (x) => { x /= 255; return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * d(p[0]) + 0.7152 * d(p[1]) + 0.0722 * d(p[2]); };
  const fill = (T, L, R) => { c.use(paint, T, T.w, T.h); gl.uniform3f(paint.u('uL'), ...L); gl.uniform3f(paint.u('uR'), ...R); c.tri(); };
  const R = {};
  for (const lin of [0, 1]) {
    // magenta (1,0,1) and green (0,g,0) at the same linear luminance: g = (0.2126+0.0722)/0.7152; painted in the
    // space the chain reads at this point (encoded when lin 0, linear when lin 1)
    const g = (0.2126 + 0.0722) / 0.7152, ge = 1.055 * Math.pow(g, 1 / 2.4) - 0.055;
    fill(src, [1, 0, 1], [0, lin ? g : ge, 0]);
    const io = { src, w: W, h: H, sw: W, sh: H, uvS: [1, 1], MS: CARD.MS, FX: CARD.FX, aux: {}, post: { bloom: { thr: -1 } }, linear: lin, k: CARD.CHAIN.k, dt: 1 / 60, frameN: 1 };
    bloom.run(io);
    c.use(copy, rd8, 64, 16); c.tex(copy, 'uT', 0, io.aux.bloom.b1); gl.uniform1f(copy.u('uEnc'), lin); c.tri();
    gl.bindFramebuffer(gl.FRAMEBUFFER, rd8.f);
    const px = new Uint8Array(64 * 16 * 4); gl.readPixels(0, 0, 64, 16, gl.RGBA, gl.UNSIGNED_BYTE, px);
    const row = Array.from({ length: 64 }, (_, i) => [px[(8 * 64 + i) * 4], px[(8 * 64 + i) * 4 + 1], px[(8 * 64 + i) * 4 + 2]]);
    const ys = row.map(Y), ends = (ys[4] + ys[59]) / 2, minY = Math.min(...ys.slice(4, 60));
    R['fringe' + lin] = +(minY / ends).toFixed(3);
    R['mid' + lin] = row[32];
    // white through the composite to the screen: no bloom (black side-chain), no flash/glitch/ca/kaleido
    fill(src, [1, 1, 1], [1, 1, 1]); fill(blk, [0, 0, 0], [0, 0, 0]);
    const io2 = { src, w: W, h: H, sw: W, sh: H, uvS: [1, 1], MS: Object.assign({}, CARD.MS, { eS: 0, dropEnv: 0, sectionId: 0 }), FX: { ca: 0, glitch: 0, kal: 0, flash: 0, seed: 1 }, aux: { bloom: { b1: blk, b2: blk } }, post: { kaleido: 0 }, linear: lin, k: CARD.CHAIN.k };
    comp.run(io2);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    const p = new Uint8Array(4); gl.readPixels(W >> 1, H >> 1, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, p);
    R['white' + lin] = p[0];
    fill(src, [0.18, 0.18, 0.18], [0.18, 0.18, 0.18]); comp.run(io2); gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.readPixels(W >> 1, H >> 1, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, p);
    R['grey18_' + lin] = p[0];
  }
  // v0.5 item 4: the knee is a knob — 0.18 grey through the linear composite at three k (LOOK.k is what the loop passes; here io.k)
  R.grey18_k = {};
  for (const kk of [0.75, 1.5, 3]) {
    fill(src, [0.18, 0.18, 0.18], [0.18, 0.18, 0.18]);
    const io3 = { src, w: W, h: H, sw: W, sh: H, uvS: [1, 1], MS: Object.assign({}, CARD.MS, { eS: 0, dropEnv: 0, sectionId: 0 }), FX: { ca: 0, glitch: 0, kal: 0, flash: 0, seed: 1 }, aux: { bloom: { b1: blk, b2: blk } }, post: { kaleido: 0 }, linear: 1, k: kk };
    comp.run(io3); gl.bindFramebuffer(gl.FRAMEBUFFER, null); const q = new Uint8Array(4); gl.readPixels(W >> 1, H >> 1, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, q);
    R.grey18_k[kk] = q[0];
  }
  R.k = CARD.CHAIN.k; R.lookK = CARD.LOOK.k; R.kMood = CARD.CHAIN.kMood; R.errs = CARD.ERRS.slice(); R.glerr = gl.getError();
  return JSON.stringify(R);
})()`;

const r = spawnSync('node', [path.join(HERE, 'cdp.js'), 'test&scene=0', JSON.stringify([{ until: 'window.CARD && CARD.frameN > 5' }, { eval: SNIPPET }])], { encoding: 'utf8', env: process.env });
const line = (r.stdout || '').split('\n').find((l) => l.includes('fringe0'));
if (!line) { console.log(r.stdout, r.stderr); console.log('FAIL chain-smoke: no result'); process.exit(1); }
const R = JSON.parse(JSON.parse(line.slice(line.indexOf('=>') + 2).trim()));
const checks = {
  'encoded blur has the dark fringe (≤ 0.8)': R.fringe0 <= 0.8,
  // (1 − e^{−k·0.18})/(1 − e^{−k}) → sRGB: k 0.75 → 0.239 → 135 · 1.5 → 0.305 → 150 · 3 → 0.439 → 177 (±3): a harder knee lifts the mids
  'knee at three k: 0.18 grey 135 / 150 / 177 (±3)': Math.abs(R.grey18_k[0.75] - 135) <= 3 && Math.abs(R.grey18_k[1.5] - 150) <= 3 && Math.abs(R.grey18_k[3] - 177) <= 3,
  'k 1.5 through io.k = the chain default (same pixel)': R.grey18_k[1.5] === R.grey18_1,
  'LOOK.k = CHAIN.k while kMood is 0': R.kMood === 0 && R.lookK === R.k,
  'linear blur has none (≥ 0.95)': R.fringe1 >= 0.95,
  'encoded tonemap never reaches white (≤ 200)': R.white0 <= 200,
  'linear chain reaches display white (≥ 254)': R.white1 >= 254,
  'no shader errors, GL clean': R.errs.length === 0 && R.glerr === 0,
};
let fails = 0;
for (const [k, ok] of Object.entries(checks)) { console.log((ok ? 'ok   ' : 'FAIL ') + k); if (!ok) fails++; }
console.log(JSON.stringify(R));
console.log(fails ? `chain-smoke: ${fails} FAIL` : 'chain-smoke: OK');
process.exit(fails ? 1 : 0);
