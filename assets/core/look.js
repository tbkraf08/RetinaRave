// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// LOOK: the shared palette and the common uniform block every shader gets (uTime uBands uBeat uArc uHarm uPal uTint).
// Derived from MS every frame. Lifted from cardioid3 COMMON. Synapse's mood palette (valence/arousal) lands here in §2.
import { TAU, clamp, ema, frac, mix, sstep, hsv } from '../math/util.js';

export const LOOK = {
  hue: 0.6, hueT: 0.6, pal: [0, 0.2, 0.5, 0.5], tint: [1, 1, 1],
  bands: [0, 0, 0], beat: [0, 0, 0, 0], arc: [0, 0, 0, 0], harm: [0, 0, 0, 0],
  time: 0,          // visual clock: the active scene's rt.time if it has one, else wall time (see loop.js)
  peak: 0,
  k: 1.5,           // the tonemap knee this frame (v0.5 item 4): CHAIN.k · (1 + CHAIN.kMood · (2·arousal − 1)), ≥ 0.2 — set by loop.js (look.js must not import post.js: gl → look, post → gl would close a cycle the bundler cannot order)
  // synapse mood palette: hue orbits a family anchor chosen by (valence, arousal); the synapse scenes read this, v3 scenes read pal
  mood: { hue: 0.38, sat: 0.5, bri: 0.6, spread: 0.2, invert: 0, anchor: 0.66, anchorSp: 0.2, hueFree: 0.6, angular: 0, spiky: 0 },
};

// mood family -> palette anchor (hue, spread): calm-dark · calm-bright · fierce-dark · euphoric (synapse2 FAMILY)
const FAMILY = [{ h: 0.66, sp: 0.16 }, { h: 0.47, sp: 0.24 }, { h: 0.93, sp: 0.3 }, { h: 0.06, sp: 0.4 }];

export function updateMood(dt, S) {
  const M = LOOK.mood, fam = FAMILY[S.moodFamily] || FAMILY[0];
  let da = fam.h - M.anchor;
  da -= Math.round(da);
  M.anchor += da * (1 - Math.exp(-dt / 5));
  M.anchorSp = ema(M.anchorSp, fam.sp, dt, 5);
  M.angular = ema(M.angular, clamp(1.4 * S.perc * (0.4 + 0.6 * S.punchy) - 0.25 + 0.3 * S.dirty * S.arousal, 0, 1), dt, 4);
  M.spiky = ema(M.spiky, clamp(0.9 * S.dirty * (0.5 + S.arousal) + 0.5 * (1 - S.valence) - 0.3, 0, 1), dt, 4);
  const I = S.intensity;
  M.hueFree += dt * (0.004 + 0.10 * I * I + 0.06 * S.kick * I);
  const anchor = M.anchor + 0.07 * Math.sin(S.flow * 0.05);
  let dh = (M.hueFree - anchor) % 1;
  if (dh > 0.5) dh -= 1;
  if (dh < -0.5) dh += 1;
  M.hue = anchor + dh * sstep(0.2, 0.62, I) * (0.5 + 0.5 * S.arousal);
  M.sat = clamp(mix(0.62, 1.0, I) * (1 - 0.55 * S.tension) + 0.35 * S.dropEnv + 0.1 * (S.valence - 0.5), 0, 1.2);
  M.bri = mix(0.5, 1.12, I) + 0.45 * S.dropEnv + 0.25 * S.tension;
  M.spread = mix(M.anchorSp * 0.7, M.anchorSp * 1.6 + 0.1, I) + 0.2 * S.tension;
  if (S.dropEvt) { M.invert = 1; M.hueFree += 0.27 + 0.25 * frac(S.seed.hue * 7.31); }
  M.invert *= Math.exp(-dt / 0.3);
}

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
  headVecs(S, C);
  updateMood(dt, S);
}

// The four HEAD vectors that are direct per-frame reads of MS (uBands uBeat uArc uHarm). Split out so a routed scene's
// draw can upload them from its own view (v0.4 routes, scenes.js renderScene); pal / tint / time are stateful and stay LOOK's.
export function headVecs(S, C) {
  C.bands = [S.bass, S.mid, S.high];
  const br = S.beatCount + 1 - Math.pow(1 - S.beatPhase, 3);
  C.beat = [S.beatPhase, S.hit, br, S.dropEnv];
  C.arc = [S.eS, S.build, S.tension, S.surprisal];
  C.harm = [S.harmAngle, S.harmVel, S.clarity, S.regularity];
}
