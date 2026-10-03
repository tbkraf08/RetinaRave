// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// TORUS2 — waves on the threads (brief-torus2 spec 2, the user's own sentence: "can we add a wave to the thread?").
//
// v0.14: the ring buffer itself now lives in assets/math/waves.js (mkWaves(), per caller) so GIELIS (id 10) can launch
// its own waves without sharing TORUS2's slots. This file is TORUS2's own instance, re-exported under the names index.js
// has always imported — the same functions, the same constants, the same state shape, so TORUS2's pixels do not move
// (IDS=3 tools/scene-md5.sh identical before and after the lift). Import then export: check.js refuses the
// `export { … } from` form because bundle.js cannot rewrite it.
import { BANDS as B, SLOTS as S, LIFE as L, mkWaves } from '../../math/waves.js';

export const BANDS = B;
export const SLOTS = S;
export const LIFE = L;

const WV = mkWaves();
export const reset = WV.reset;
export const launch = WV.launch;
export const train = WV.train;
export const trainMode = WV.trainMode;
export const step = WV.step;
export const fill = WV.fill;
export const live = WV.live;
export const positions = WV.positions;
export const fires = WV.fires;
export const lastAmp = WV.lastAmp;
