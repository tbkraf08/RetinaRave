// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// DUST — the singer's grains, and the ribbon as the lone voice (DECISIONS §127; docs/plans/VOX-SCENES-PLAN.md §1 "DUST").
// DUST's grammar is "one frequency band per grain", and a grain's band is its PLACE (shaders.js §58: the band rank is the
// radius in every shape) — so a voice IS bands, and the voice has a place: the grains whose bin sits at the sung pitch's
// first three PARTIALS (voxHz, 2×, 3× on the 256-bin log axis — three thin shells at the pitch's radii, rising and falling
// with it) are LIFTED in the sung note's hue, and the rest of the cloud is scaled by (1 − DIM·w): the light is MOVED, never
// added — habit.js's rule, by a uniform factor rather than a pass. The lift's gain is normalised here, on the CPU, from the
// grains' own density over the axis (fx = .95·u^1.4, so the density in fx goes as fx^(−2/7)): the partials' expected share
// of the grains is p, the cloud gives up DIM·w, so the lifted grains take DIM·w·(1 − p)/p — the population mean of the
// brightness factor is exactly 1, capped at GMAX where p is tiny (a very high pitch: few grains up there).
// The RIBBON: formations.js's shapeFor() gains the voice — `!subGate && (denK < lone || voxSec > .5)` → RIBBON, with `voxSec`
// = w over SEC 8 s (a seam decision is about a section, not a frame): the ribbon IS "the breakdown, or a lone voice" and until
// now it only knew "no kicks". In the ribbon the line's y rises with the sung pitch's height y01 (the one vertical DUST has;
// the cloud's axis is radial, so pitch-as-height stops there).
// w 0 (voxConf 0: the fake timeline, the traces) = today's bytes: the shader's voice block is skipped whole, the ribbon's lift
// is 0, shapeFor(MS, 0) is shapeFor(MS). `&dvox=0` (hooks.dvox) = today's bytes on a voiced track too. The planner's pick on the
// plan's open question 4 (the partials AND the ribbon, or the ribbon alone) is BOTH, pending the user's eye (§127).
// Cost: one vec4 + one vec2 uniform, ~8 ALU per vertex inside the block (none at w 0).
import { mkVox, vox } from '../../math/vox.js';
import { clamp, ema } from '../../math/util.js';

export const VOXD = {
  on: 1,        // hooks.dvox — the A/B switch (0 = the pre-§127 cloud on every frame)
  DIM: 0.25,    // the cloud gives up this much of its light at w 1 — the plan's (1 − .25·w)
  GMAX: 12,     // the lifted grains' gain cap (p tiny = a pitch where few grains live: the budget is exact up to ~C5, within 4 % at C6)
  W: 0.0075,    // the partial window's sigma on the 0..1 log axis (a semitone is .0092; a bin .0039)
  A: [1, 0.6, 0.4],   // the three partials' weights
  RIBY: 0.8,    // the ribbon's rise at the top of the voice's range, in WAVE units (the wave is ±1 → ±.75·(.4 + lvl) scene units; y01 .5 = where it sits today)
  SEC: 8,       // s: voxSec's window — w over a section
  LN: Math.log(16000 / 30),   // the spec axis: bin j is 30·(16000/30)^(j/256) Hz (synapse/analyzer.js)
};

const VX = mkVox();
export const OUT = { w: 0, pc: -1, y01: -1, rank: 0, gain: 0, hueT: 0, ribY: 0, sec: 0, p: 0 };

// where a frequency sits on the 0..1 log axis the grains sample (`fx` in the shader)
export const rankOf = (hz) => clamp(Math.log(hz / 30) / VOXD.LN, 0, 1);
// the grains' density over fx: u uniform on 0..1, fx = .95·u^1.4 → du/dfx = (1/1.4)·(fx/.95)^(1/1.4 − 1)/.95, 0 beyond .95
export const density = (fx) => (fx <= 0 || fx >= 0.95 ? 0 : (1 / 1.4) * Math.pow(fx / 0.95, 1 / 1.4 - 1) / 0.95);
// the partials' expected share of the grains: Σ a_k · ∫ exp(−((fx − f_k)/σ)²) ρ(fx) dfx ≈ Σ a_k · σ√π · ρ(f_k)
export function shareAt(rank) {
  let p = 0;
  for (let k = 0; k < 3; k++) p += VOXD.A[k] * VOXD.W * Math.sqrt(Math.PI) * density(rank + Math.log(k + 1) / VOXD.LN);
  return p;
}

// One frame. Returns OUT (reused): w, pc, y01, the sung pitch's rank, the lifted grains' gain, the note's palette t, the
// ribbon's rise, voxSec. At w 0 every number the shader reads is 0 (the block is skipped) and sec decays.
export function voice(dt, MS) {
  const V = vox(VX, dt, MS);
  const w = VOXD.on ? V.w : 0, pc = w > 0 ? V.pc : -1;
  OUT.w = w; OUT.pc = pc; OUT.y01 = pc >= 0 ? V.y01 : -1;
  OUT.sec = MS.voxConf > 0 ? ema(OUT.sec, w, dt, VOXD.SEC) : 0;   // no read at all = no section memory either (the exact reset)
  if (OUT.sec < 1e-4) OUT.sec = 0;
  if (w > 0 && pc >= 0 && V.hz > 0) {
    OUT.rank = rankOf(V.hz);
    OUT.p = shareAt(OUT.rank);
    OUT.gain = Math.min(VOXD.GMAX, VOXD.DIM * (1 - OUT.p) / Math.max(OUT.p, 1e-6));
    OUT.hueT = pc / 12;
    OUT.ribY = w * (V.y01 - 0.5) * VOXD.RIBY;
  } else { OUT.rank = 0; OUT.p = 0; OUT.gain = 0; OUT.hueT = 0; OUT.ribY = 0; if (pc < 0) OUT.w = 0; }
  return OUT;
}
