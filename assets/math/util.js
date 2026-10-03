// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// Shared numerics. Pure, node-importable, no DOM. Lifted from cardioid3 "util".

export const TAU = Math.PI * 2;

export const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
export const mix = (a, b, t) => a + (b - a) * t;
export const frac = (x) => x - Math.floor(x);
export const wrap1 = (x) => x - Math.round(x);

export const sstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

// Exponential moving average with a time constant tau (seconds), exact for the step dt.
export const ema = (cur, tgt, dt, tau) => cur + (tgt - cur) * (1 - Math.exp(-dt / tau));

// Critically damped spring, exact step.
export class Spring {
  constructor(x = 0, w = 4) {
    this.x = x;
    this.v = 0;
    this.w = w;
  }
  step(tgt, dt, w = this.w) {
    const e = Math.exp(-w * dt);
    const d = this.x - tgt;
    const t = (this.v + w * d) * dt;
    this.x = tgt + (d + t) * e;
    this.v = (this.v - w * t) * e;
    return this.x;
  }
  set(x) {
    this.x = x;
    this.v = 0;
  }
}

// HSV -> RGB, all in [0,1].
export function hsv(h, s, v) {
  const f = (n) => {
    const k = (n + h * 6) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return [f(5), f(3), f(1)];
}
