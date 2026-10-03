// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// POST: the FX state derived from MS, and the effect-chain runner. Effects are plug-ins (assets/effects/*.js,
// docs/CONTRACTS.md §3); post.js only orders and runs them. Lifted from cardioid3 frame() fx block + post chain.
import { ema } from '../math/util.js';
import { G } from './gl.js';

export const FX = { glitch: 0, flash: 0, kal: 0, ca: 0, seed: 0 };
// The chain's colour space (v0.3 §20). linear: the scene's encoded output is decoded once at the chain input (by
// feedback, or by the fallback pass below when feedback is skipped), bloom / exposure / the composite's adds and
// tonemap run on linear radiance, the composite encodes before vignette and dither. k: the tonemap knee,
// (1 − exp(−k·c)) / (1 − exp(−k)) so linear 1.0 reaches display white. &linear=0|1 under #test (harness.js).
// v0.5 item 4: k is a LOOK parameter — LOOK.k = k · (1 + kMood · (2·arousal − 1)) (set in loop.js — look.js must not import this file), the frame's knee the loop hands
// runChain as io.k; kMood 0 (the default) makes it exactly k, so the reference md5s hold; &k= / &kmood= under #test.
export const CHAIN = { linear: true, k: 1.5, kMood: 0 };

export function updateFX(dt, S, peak) {
  if (S.dropEvt) {
    FX.flash = 0.9;
    FX.glitch = 1;
  }
  if (S.surpriseEvt) FX.glitch = Math.max(FX.glitch, 0.8);
  if (S.onset && S.surprisal > 0.4) FX.glitch = Math.max(FX.glitch, S.surprisal * 0.7);
  FX.flash *= Math.exp(-dt / 0.12);
  FX.glitch *= Math.exp(-dt / 0.22);
  FX.ca = 0.0015 + 0.012 * S.hit * S.eS + 0.03 * FX.glitch + 0.01 * S.surprisal;
  const kalT = (peak && S.dropEnv < 0.12 && (S.beatCount % 16) >= 12 && S.eS > 0.45) ? 1 : 0;
  FX.kal = ema(FX.kal, kalT, dt, kalT ? 0.25 : 0.4);
  FX.seed = (FX.seed + 1) % 997;
}

export const EFFECTS = [];

let decodeP = null, decodeT = null, decodeCtx = null;
export function addEffect(fx, ctx) {
  if (!decodeCtx) {
    decodeCtx = ctx;
    decodeP = ctx.mkProg(ctx.oklch + 'uniform sampler2D uT;uniform vec2 uUvS;void main(){o=vec4(srgbToLin(texture(uT,vUv*uUvS).rgb),1.);}', 'chain-decode');
    ctx.onResize((w, h) => { ctx.freeTarget(decodeT); decodeT = ctx.mkTarget(w, h); });
  }
  fx.init(ctx);
  fx.enabled = fx.enabled !== false;
  EFFECTS.push(fx);
  EFFECTS.sort((a, b) => a.order - b.order);
}

// Run the chain: src is the scene target rendered at (sw, sh) inside a (PW, PH) target. Each effect returns a new
// src target or null to keep the current one; the last one (composite) draws to the screen.
export function runChain(src, sw, sh, io) {
  io.src = src;
  io.w = G.PW;
  io.h = G.PH;
  io.sw = sw;
  io.sh = sh;
  io.uvS = [(sw - 0.5) / G.PW, (sh - 0.5) / G.PH];
  io.aux = {};
  io.FX = FX;
  io.linear = CHAIN.linear;
  if (io.k === undefined) io.k = CHAIN.k; // the loop passes LOOK.k (v0.5); a caller without one (chain-smoke) gets the base
  io.decoded = false; // set by the effect that decoded the scene output (feedback, order 10)
  for (const fx of EFFECTS) {
    if (io.linear && !io.decoded && fx.order > 10) decode(io); // feedback was skipped: decode here
    const p = io.post[fx.name], on = p && p.on !== undefined ? p.on : fx.enabled;
    if (!on) continue;
    if (fx.when && !fx.when(io)) continue;
    const out = fx.run(io);
    if (out) io.src = out;
  }
}

function decode(io) {
  const { gl, tex, tri, use } = decodeCtx;
  use(decodeP, decodeT, io.w, io.h);
  tex(decodeP, 'uT', 0, io.src);
  gl.uniform2f(decodeP.u('uUvS'), io.uvS[0], io.uvS[1]);
  tri();
  io.src = decodeT;
  io.uvS = [1, 1];
  io.decoded = true;
}
