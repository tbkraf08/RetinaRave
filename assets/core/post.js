// POST: the FX state derived from MS, and the effect-chain runner. Effects are plug-ins (assets/effects/*.js,
// docs/CONTRACTS.md §3); post.js only orders and runs them. Lifted from cardioid3 frame() fx block + post chain.
import { ema } from '../math/util.js';
import { G } from './gl.js';

export const FX = { glitch: 0, flash: 0, kal: 0, ca: 0, seed: 0 };

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

export function addEffect(fx, ctx) {
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
  for (const fx of EFFECTS) {
    if (!fx.enabled) continue;
    if (fx.when && !fx.when(io)) continue;
    const out = fx.run(io);
    if (out) io.src = out;
  }
}
