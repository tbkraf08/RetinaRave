// LOOK: the shared palette and the common uniform block every shader gets (uTime uBands uBeat uArc uHarm uPal uTint).
// Derived from MS every frame. Lifted from cardioid3 COMMON. Synapse's mood palette (valence/arousal) lands here in §2.
import { TAU, clamp, ema, frac, mix, sstep, hsv } from '../math/util.js';

export const LOOK = {
  hue: 0.6, hueT: 0.6, pal: [0, 0.2, 0.5, 0.5], tint: [1, 1, 1],
  bands: [0, 0, 0], beat: [0, 0, 0, 0], arc: [0, 0, 0, 0], harm: [0, 0, 0, 0],
  time: 0,          // visual clock: the active scene's rt.time if it has one, else wall time (see loop.js)
  peak: 0,
};

export function updateLook(dt, S, now) {
  const C = LOOK;
  const peak = C.peak = S.arc === 'peak' ? 1 : 0;
  C.hue = frac(C.hue + dt * (0.004 + 0.05 * S.eS + 0.12 * clamp(S.harmVel * 0.4, 0, 1)) * (0.1 + 0.9 * S.presence));
  const hueT = C.hueT = frac(C.hue + S.seed.hue + S.harmAngle / TAU * 0.2);
  C.pal[0] = hueT;
  C.pal[1] = ema(C.pal[1], mix(0.13, 0.4, sstep(0.25, 0.8, S.eM / Math.max(S.eMax, 0.2) * 0.8 + 0.3 * peak)), dt, 1.5);
  C.pal[2] = ema(C.pal[2], mix(0.5, 1.15, sstep(0.1, 0.75, S.eM + 0.3 * S.build + 0.3 * peak)), dt, 1);
  // the (1-presence) wobble is the only place a wall-clock term enters: it only acts while there is no music
  C.pal[3] = (0.28 + 0.55 * Math.pow(S.eS, 0.8) + 0.2 * S.hit + 0.2 * S.dropEnv) * (0.7 + 0.3 * S.presence) * (1 + 0.25 * Math.sin(now * 0.7) * (1 - S.presence));
  C.tint = hsv(hueT, 0.75, 1);
  C.bands = [S.bass, S.mid, S.high];
  const br = S.beatCount + 1 - Math.pow(1 - S.beatPhase, 3);
  C.beat = [S.beatPhase, S.hit, br, S.dropEnv];
  C.arc = [S.eS, S.build, S.tension, S.surprisal];
  C.harm = [S.harmAngle, S.harmVel, S.clarity, S.regularity];
}
