// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// Solver after Pavel Dobryakov, WebGL-Fluid-Simulation (MIT, 2017) — https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
// The injection grammar: MS → the forces, the dye and the solver's parameters for one step (FLUID-PLAN Step 1, the table).
// PURE: no GL, no DOM, imports only math/*; node-importable (tools/test_fluid.js, tools/check.js). fluid.js applies what
// plan() returns. Every MS field read here is in FLUID_FEATS — main.js checks the list against ENGINE.FEATS like a scene's
// feats and check.js fails on a read outside it (the substrate feeds every scene, so the rule is stricter than a scene's warn).
// The mappings are CONTRACTS §1.18's kind: levels at heard time, events placed on their frame, *Amp for size, never *Vel,
// never pred*. One musical element → one channel: the sub is WHERE the ink enters, the kick LIFTS it, the snare SHEARS it,
// the hats are droplets from the surface, the key is its COLOUR, the beat kneads the pool, the filter makes it syrup.
// Units: positions in uv (0..1, y up), velocities in uv/s — a splat ADDS its dx/dy to the field once (an impulse); the
// persistent emitters (the sub, the hats while hat2 is up) add per frame scaled by 60·dt so a 30 fps machine injects the
// same per second. Seeded, never random: the hats' x is hash(beatCount·7 + i, seed.a).
import { clamp, frac, sstep, hsv, mix } from '../../math/util.js';
import { mkAnchor, sectorPc } from '../../math/keycolour.js';
import { srgbToLin1 } from '../../math/oklab.js';

export const FLUID_FEATS = ['subNote', 'subGate', 'subGlide', 'subHz', 'bassReg', 'kickEvt', 'kickAmp', 'kickAge', 'snareEvt', 'snareAmp',
  'hat2', 'denH', 'beatCount', 'seed', 'beatPhase', 'key', 'mode', 'keyConf', 'tonicConf', 'modeShade', 'valence', 'harmAngle',
  'tension', 'lpSweep', 'buildLive', 'tongueAmbig', 'tongueOn', 'dropLiveEvt', 'hush', 'calm', 'loudRel', 'presence', 'bpm'];

// The grammar's constants, one table (DECISIONS §104 says where each came from). Velocities in uv/s, dye in linear units.
export const K = {
  RADIUS: 0.0025,  // the splat's exp(−|p|²/r), aspect-corrected in the shader (the reference's default)
  SUB_V: 0.08,     // the sub emitter: +dy per frame (×60·dt) while subGate is open
  SUB_X: 0.02,     // its lean with the glide, per 12 st/s
  SUB_DYE: 0.015,  // its ink per frame (×60·dt): ≈ 0.9 at the mouth at dyeDiss 1
  KICK_V: 0.9,     // the kick: dy = KICK_V·sqrt(kickAmp), one impulse from the floor, radius ×2; 40 % on the two frames after
  KICK_DYE: 0.5,
  SNARE_V: 0.6,    // the snare: ±SNARE_V·snareAmp sideways at mid height
  SNARE_DYE: 0.25,
  HAT_V: -0.15,    // the hats: droplets falling from y 0.9, radius ×0.5, up to 3 of them while hat2 > 0.3
  HAT_DYE: 0.3,
  BODY: 0.35,      // the beat's breath: fy = −BODY·cos⁴(π·beatPhase), shaped cos(π(2x−1)) in the shader (a uniform force is a gradient)
  DROP_V: 2.5,     // the live drop: one impulse up from the sub's x, radius ×4, and the pool clears (dyeDiss DROP_DISS) for one beat
  DROP_DYE: 1.0,
  DROP_DISS: 6,
};

export const mkState = () => ({ clearLeft: 0, anchor: mkAnchor(), xSub: 0.5 });

const hash = (i, a) => frac(Math.sin(i * 12.9898 + a * 78.233) * 43758.5453);

// plan(S, dt, st, moodHue) → { splats: [{x, y, dx, dy, r, g, b, rad}], body, params: {curl, velDiss, dyeDiss, pressure, radius},
// gain, colour: [r, g, b] (linear) }. `st` is mkState()'s (the anchor's ease, the drop's countdown, the last emitter x);
// `moodHue` is LOOK.mood.hue — the hue the anchor slides to while the key is not trusted (the same fallback every key-anchored scene has).
export function plan(S, dt, st, moodHue = 0.6) {
  const f = 60 * dt; // per-frame emitters as a rate
  const g = S.presence * (0.3 + 0.7 * S.loudRel) * (1 - 0.8 * S.hush) * (1 - 0.5 * S.calm); // quiet is quiet
  // the dye colour: the shared key hue (keycolour.js) — warm / cool by the mode and the bar's shade, saturation by how sure the tonic is
  const A = st.anchor.anchor(dt, S.key | 0, S.mode | 0, S.keyConf || 0, isFinite(S.valence) ? S.valence : 0.5, S.harmAngle || 0, moodHue, null, S.modeShade || 0);
  const col = hsv(frac(A.hue), clamp(A.sat * (0.4 + 0.6 * S.tonicConf), 0, 1), 1).map(srgbToLin1);
  const splats = [];
  const add = (x, y, dx, dy, dye, rad) => splats.push({ x, y, dx, dy, r: col[0] * dye, g: col[1] * dye, b: col[2] * dye, rad: K.RADIUS * rad });
  // the sub emitter: x on the circle of fifths (the sector of the bass note, half a sector in from the wall), y by the register
  if (S.subGate > 0) {
    const sec = S.subNote >= 0 ? sectorPc(S.subNote) + 0.5 : 12 * frac(S.harmAngle / (2 * Math.PI));
    st.xSub = sec / 12;
    const y = 0.12 + 0.25 * S.bassReg;
    const wide = 1 + 0.5 * (1 - clamp((S.subHz - 30) / 90, 0, 1)); // a lower sub is a wider mouth
    add(st.xSub, y, K.SUB_X * clamp(S.subGlide / 12, -1, 1) * g * f, K.SUB_V * g * f, K.SUB_DYE * g * f, wide);
  }
  // the kick: an impulse up from the floor under the sub, sized by the hit; the two frames after keep 40 %
  const kAge = S.kickAge < 99 ? Math.max(0, S.kickAge) : 99;
  if (S.kickEvt || kAge < 2 / 60) {
    const w = S.kickEvt ? 1 : 0.4;
    add(st.xSub, 0.06, 0, K.KICK_V * Math.sqrt(Math.max(0, S.kickAmp)) * g * w, K.KICK_DYE * g * w, 2);
  }
  // the snare: a lateral shear at mid height
  if (S.snareEvt) {
    add(0.3, 0.5, K.SNARE_V * S.snareAmp * g, 0, K.SNARE_DYE * g, 1);
    add(0.7, 0.5, -K.SNARE_V * S.snareAmp * g, 0, K.SNARE_DYE * g, 1);
  }
  // the hats: up to three droplets from the surface, seeded by the beat
  if (S.hat2 > 0.3) {
    const n = Math.min(3, Math.round(S.denH));
    for (let i = 0; i < n; i++) add(hash(S.beatCount * 7 + i, S.seed.a), 0.9, 0, K.HAT_V * g * f, K.HAT_DYE * g * f, 0.5);
  }
  // the live drop: the pool clears in one beat (the countdown runs on dt, not on a clock field)
  if (S.dropLiveEvt) {
    add(st.xSub, 0.06, 0, K.DROP_V * g, K.DROP_DYE * g, 4);
    st.clearLeft = 60 / Math.max(60, S.bpm);
  } else st.clearLeft = Math.max(0, st.clearLeft - dt);
  // the beat's breath on the whole pool
  const c = Math.cos(Math.PI * S.beatPhase), c2 = c * c;
  const body = -K.BODY * c2 * c2 * g;
  // the solver's parameters
  const voidT = Math.max(S.buildLive, S.tongueOn === 1 ? S.tongueAmbig : 0); // ink accumulates through the void
  const params = {
    curl: 10 + 40 * S.tension,
    velDiss: 0.2 + 2.8 * sstep(0.80, 0.97, S.lpSweep) + 2 * S.hush,
    dyeDiss: st.clearLeft > 0 ? K.DROP_DISS : mix(1.0, 0.05, clamp(voidT, 0, 1)),
    pressure: 0.8,
    radius: K.RADIUS,
  };
  return { splats, body, params, gain: g, colour: col };
}
