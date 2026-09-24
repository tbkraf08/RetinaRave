// OKLab / OKLCH in JS (Björn Ottosson, 2020) — the twin of assets/core/oklch.js's GLSL chunk, for tests and for any
// palette computed on the CPU. Pure functions, no state. Hue is a turn (0..1), L 0..1, C in OKLab units (≈ 0..0.37).
// Linear sRGB in and out; encode/decode with linToSrgb / srgbToLin. The GLSL chunk uses the same constants: the smoke
// test (tools/oklch-smoke.js) checks the GPU against these to 2/255.
const TAU = Math.PI * 2;
const cbrt = (x) => (x < 0 ? -Math.cbrt(-x) : Math.cbrt(x));

export function linToOkLab([r, g, b]) {
  const l = cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
}

export function okLabToLin([L, a, b]) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ * l_ * l_, m = m_ * m_ * m_, s = s_ * s_ * s_;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s];
}

export const linToSrgb1 = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
export const srgbToLin1 = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
export const linToSrgb = (c) => c.map((x) => linToSrgb1(Math.min(1, Math.max(0, x))));
export const srgbToLin = (c) => c.map((x) => srgbToLin1(Math.min(1, Math.max(0, x))));

export const inGamut = (c, eps = 1e-4) => c.every((x) => x >= -eps && x <= 1 + eps);

// OKLCH → linear sRGB with the chunk's clip rule: chroma shrunk toward the grey axis at the same L until inside.
export function okClip(h, L, C) {
  L = Math.min(1, Math.max(0, L));
  const a = C * Math.cos(TAU * h), b = C * Math.sin(TAU * h);
  if (inGamut(okLabToLin([L, a, b]))) return 1;
  let lo = 0, hi = 1;
  for (let i = 0; i < 14; i++) {
    const t = 0.5 * (lo + hi);
    if (inGamut(okLabToLin([L, a * t, b * t]))) lo = t; else hi = t;
  }
  return lo;
}
export function palOK(h, L, C) {
  L = Math.min(1, Math.max(0, L));
  const t = okClip(h, L, C);
  return okLabToLin([L, C * t * Math.cos(TAU * h), C * t * Math.sin(TAU * h)]).map((x) => Math.min(1, Math.max(0, x)));
}

// The chroma that fits every hue at lightness L (the chunk's okCmax): 0.11 at 0.7, linear to 0 at black and white.
export const cMax = (L) => 0.11 * Math.min(1, 1.4 * L, 4 * (1 - L));

// The largest chroma inside sRGB at (L, h): bisection to 1e-6 (the chunk's clip is the same search, 14 halvings of C:
// at the gamut edge a channel moves several units per unit of chroma, so 10 halvings of C 0.3 left 11/255 between
// the GPU's and the twin's last step; 14 leaves under 1/255).
export function maxChroma(L, h, hi = 0.5) {
  let lo = 0;
  for (let i = 0; i < 20; i++) {
    const t = 0.5 * (lo + hi);
    if (inGamut(okLabToLin([L, t * Math.cos(TAU * h), t * Math.sin(TAU * h)]))) lo = t; else hi = t;
  }
  return lo;
}
