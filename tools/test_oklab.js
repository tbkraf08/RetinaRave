// OKLab twin test (node, no Chrome): Ottosson's reference triples, round trips, the clip rule, and the claim behind
// v0.3's colour block — C 0.11 is inside sRGB at L 0.7 for every hue. usage: node tools/test_oklab.js
import { linToOkLab, okLabToLin, linToSrgb, srgbToLin, okClip, palOK, maxChroma } from '../assets/math/oklab.js';
let fails = 0;
const ok = (name, cond, info = '') => { console.log((cond ? 'ok   ' : 'FAIL ') + name + (info ? ' · ' + info : '')); if (!cond) fails++; };
const near = (a, b, e) => a.every((x, i) => Math.abs(x - b[i]) <= e);
// reference values from the OKLab article (linear sRGB primaries → OKLab), 4 decimals
const REF = [[[1, 1, 1], [1.0, 0.0, 0.0]], [[1, 0, 0], [0.627955, 0.224863, 0.125846]], [[0, 1, 0], [0.866440, -0.233888, 0.179498]],
  [[0, 0, 1], [0.452014, -0.032457, -0.311528]], [[0, 0, 0], [0, 0, 0]]];
for (const [rgb, lab] of REF) ok('lin→OKLab ' + rgb.join(','), near(linToOkLab(rgb), lab, 2e-4), linToOkLab(rgb).map((x) => x.toFixed(4)).join(','));
let worst = 0;
for (let r = 0; r <= 1; r += 0.25) for (let g = 0; g <= 1; g += 0.25) for (let b = 0; b <= 1; b += 0.25) {
  const back = okLabToLin(linToOkLab([r, g, b]));
  worst = Math.max(worst, ...back.map((x, i) => Math.abs(x - [r, g, b][i])));
}
ok('OKLab round trip on a 5³ grid', worst < 1e-6, 'max err ' + worst.toExponential(1));
let w2 = 0;
for (let i = 0; i <= 100; i++) { const x = i / 100; w2 = Math.max(w2, Math.abs(linToSrgb([srgbToLin([x])[0]])[0] - x)); }
ok('sRGB curve round trip', w2 < 1e-9, 'max err ' + w2.toExponential(1));
// the colour block's constants: chroma 0.11 fits every hue at L 0.7; report the tightest hue
let minC = 1, minH = 0;
for (let i = 0; i < 360; i++) { const c = maxChroma(0.7, i / 360); if (c < minC) { minC = c; minH = i; } }
ok('C 0.11 in gamut at L 0.7 for all 360 hues', minC >= 0.11, `min max-chroma ${minC.toFixed(4)} at hue ${minH}°`);
let clipped = 0;
for (let i = 0; i < 360; i++) if (okClip(i / 360, 0.7, 0.11) < 1) clipped++;
ok('okClip keeps every hue at L .7 C .11', clipped === 0, clipped + ' clipped');
// the clip rule: an out-of-gamut request comes back grey-er at the same L and hue, inside sRGB
const big = palOK(0.75, 0.7, 0.3), lab = linToOkLab(big);
ok('clip preserves L (±0.002) and lands in gamut', Math.abs(lab[0] - 0.7) < 2e-3 && big.every((x) => x >= 0 && x <= 1), 'L ' + lab[0].toFixed(4) + ' rgb ' + big.map((x) => x.toFixed(3)).join(','));
const hueOf = (l) => ((Math.atan2(l[2], l[1]) / (2 * Math.PI)) + 1) % 1;
ok('clip preserves hue (±0.002 turn)', Math.abs(hueOf(lab) - 0.75) < 2e-3, 'hue ' + hueOf(lab).toFixed(4));
// grey axis: L alone is a neutral ramp, monotone in linear light
let mono = true; let prev = -1;
for (let i = 0; i <= 20; i++) { const c = palOK(0, i / 20, 0); if (c[0] <= prev || Math.abs(c[0] - c[1]) > 1e-6 || Math.abs(c[1] - c[2]) > 1e-6) mono = false; prev = c[0]; }
ok('grey axis neutral and monotone', mono);
console.log(fails ? `test_oklab: ${fails} FAIL` : 'test_oklab: OK');
process.exit(fails ? 1 : 0);
