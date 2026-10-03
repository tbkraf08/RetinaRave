// Retina Rave — © 2026 Thomas Kraft. Licensed under the Retina Rave License (MIT + the Guest-List Clause):
// use it at a party and Toma gets in free. Full text: https://retinarave.com/LICENSE and ./LICENSE in the repo.
// Source: https://github.com/tbkraf08/RetinaRave
// DUST — the beat grid (DECISIONS §57 step 1, §58 task B, §61 step 2, §66, §78). Since §85 the profile itself — K, STEP,
// DOWN, the nudge (`spin`), the accent (`accent21` / ACC), the re-seat offset (JUMP / BLEED) and the seam trigger — is
// `assets/math/beatgrid.js`, lifted verbatim so MANDALA could read it (a scene imports only math/*, CONTRACTS §0). What is
// DUST's alone stays here: the torus's and the galaxy's own rates on top of the cloud's spin. The names re-exported below are
// the ones index.js and the §61–§80 receipts used; `import` then `export` (never `export … from`: bundle.js cannot rewrite it).
import { ACC, BLEED, DOWN, JUMP, K, STEP, accentOf, barIndex, gFor, lead, mkSpin, mkTrigger, phi, phiDot, spin, trigger, wFor } from '../../math/beatgrid.js';

export const TORUS_K = 0.7;       // the torus's main circle turns this much again on top of the cloud's spin
export const GAL_K = 0.9;         // the galaxy's winding rate, divided by (r + .35) so the core winds faster

export { ACC, BLEED, DOWN, JUMP, K, STEP, accentOf, barIndex, gFor, lead, mkSpin, mkTrigger, phi, phiDot, spin, trigger, wFor };
