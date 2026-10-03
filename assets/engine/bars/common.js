// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// The bar store's shared constants and helpers (bars.js and its sections.js mixin both import them — no cycle).
export const NBAR = 256;          // bars of history (~7 min at 150 BPM)
export const DIM = 12;            // the per-beat energy vector (bars/feed.js FEAT_NAMES)
export const W_CLS = [1, 1, 0.5]; // kick, snare, hat weights in a bits distance
export const EPS = 0.08;          // the energy distance's floor per dim (the dims are ~0..1)
export const pop = (x) => { x -= (x >> 1) & 0x5555; x = (x & 0x3333) + ((x >> 2) & 0x3333); x = (x + (x >> 4)) & 0x0f0f; return (x + (x >> 8)) & 0x1f; };
